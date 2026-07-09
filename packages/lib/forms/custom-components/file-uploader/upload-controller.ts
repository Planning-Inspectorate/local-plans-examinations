import type { Request, RequestHandler, Response } from 'express';
import type {
	FileUploadDestination,
	FileUploadStorageAdapterFactory,
	FileUploaderQuestionConfig,
	FileUploaderSession,
	UploadedFile,
	UploadedRequestFile
} from './types.ts';
import { validateFiles } from './validation.ts';

export type FileUploaderControllerOptions = {
	fieldName: string;
	storage: FileUploadStorageAdapterFactory;
	question: Pick<
		FileUploaderQuestionConfig,
		'allowedFileExtensions' | 'allowedMimeTypes' | 'maxFileSizeBytes' | 'maxFilesPerUpload' | 'maxTotalUploadSizeBytes'
	>;
	sessionKey?: string | ((req: Request) => string);
	destination?: FileUploadDestination | ((req: Request) => FileUploadDestination | Promise<FileUploadDestination>);
	redirect?: string | ((req: Request) => string);
};

type RequestWithFiles = Request & {
	files?: UploadedRequestFile[];
	file?: UploadedRequestFile;
	session: FileUploaderSession & Record<string, unknown>;
};

export function createFileUploaderUploadController(options: FileUploaderControllerOptions): RequestHandler {
	return async (req: Request, res: Response) => {
		const request = req as RequestWithFiles;
		const sessionKey = resolveSessionKey(request, options);
		const session = ensureFileUploaderSession(request);
		const files = normaliseRequestFiles(request);
		const existingFiles = session.fileUploader?.[sessionKey]?.uploadedFiles ?? [];
		const errors = validateFiles(files, existingFiles, {
			allowedFileExtensions: options.question.allowedFileExtensions,
			allowedMimeTypes: options.question.allowedMimeTypes,
			maxFileSizeBytes: options.question.maxFileSizeBytes,
			maxFilesPerUpload: options.question.maxFilesPerUpload ?? 3,
			maxTotalUploadSizeBytes: options.question.maxTotalUploadSizeBytes ?? 1024 * 1024 * 1024
		});

		if (errors.length > 0) {
			session.errors = { 'upload-form': { msg: 'Errors encountered during file upload' } };
			session.errorSummary = errors;
			return redirectSafely(res, resolveRedirect(request, options));
		}

		const storage = await options.storage(request);
		const destination = await resolveDestination(request, options);
		const uploadedFiles: UploadedFile[] = [];

		for (const file of files) {
			uploadedFiles.push(await storage.upload(file, destination));
		}

		session.fileUploader = {
			...session.fileUploader,
			[sessionKey]: {
				uploadedFiles: [...existingFiles, ...uploadedFiles]
			}
		};
		delete session.errors;
		delete session.errorSummary;

		return redirectSafely(res, resolveRedirect(request, options));
	};
}

export function createFileUploaderDeleteController(options: FileUploaderControllerOptions): RequestHandler {
	return async (req: Request, res: Response) => {
		const request = req as RequestWithFiles;
		const sessionKey = resolveSessionKey(request, options);
		const session = ensureFileUploaderSession(request);
		const fileId = request.params.fileId;
		const uploadedFiles = session.fileUploader?.[sessionKey]?.uploadedFiles ?? [];
		const file = uploadedFiles.find((item) => item.id === fileId);

		if (file) {
			const storage = await options.storage(request);
			await storage.delete?.(file);
		}

		session.fileUploader = {
			...session.fileUploader,
			[sessionKey]: {
				uploadedFiles: uploadedFiles.filter((item) => item.id !== fileId)
			}
		};

		return redirectSafely(res, resolveRedirect(request, options));
	};
}

function normaliseRequestFiles(req: RequestWithFiles): UploadedRequestFile[] {
	if (Array.isArray(req.files)) {
		return req.files;
	}

	if (req.file) {
		return [req.file];
	}

	return [];
}

function ensureFileUploaderSession(req: RequestWithFiles): FileUploaderSession {
	if (!req.session) {
		throw new Error('File uploader requires session middleware');
	}
	req.session.fileUploader ??= {};
	return req.session;
}

function resolveSessionKey(req: Request, options: FileUploaderControllerOptions): string {
	if (typeof options.sessionKey === 'function') {
		return options.sessionKey(req);
	}

	return options.sessionKey ?? options.fieldName;
}

async function resolveDestination(
	req: Request,
	options: FileUploaderControllerOptions
): Promise<FileUploadDestination> {
	if (typeof options.destination === 'function') {
		return options.destination(req);
	}

	return options.destination ?? {};
}

export function isSafeLocalRedirect(target: string): boolean {
	if (!target || typeof target !== 'string') {
		return false;
	}

	if (!target.startsWith('/')) {
		return false;
	}

	if (target.startsWith('//')) {
		return false;
	}

	if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(target)) {
		return false;
	}

	return true;
}

function redirectSafely(res: Response, target: string): void {
	res.redirect(isSafeLocalRedirect(target) ? target : '/');
}

function resolveRedirect(req: Request, options: FileUploaderControllerOptions): string {
	if (typeof options.redirect === 'function') {
		const redirect = options.redirect(req);
		if (isSafeLocalRedirect(redirect)) {
			return redirect;
		}
	}

	if (typeof options.redirect === 'string' && isSafeLocalRedirect(options.redirect)) {
		return options.redirect;
	}

	const referer = req.get('referer');
	if (referer && isSafeLocalRedirect(referer)) {
		return referer;
	}

	// Commented out due to GH security alert, will look at removing / resolving with the cover letter release
	// const fallback = req.originalUrl.replace(/\/(?:upload-documents|delete-document\/[^/]+)\/?$/, '');
	// if (isSafeLocalRedirect(fallback)) {
	// 	return fallback;
	// }

	return '/';
}
