import type { FileUploaderValidationMessages, UploadedFile, UploadedRequestFile } from './types.ts';
import { sanitiseFileName } from '../../../storage/index.ts';
export { sanitiseFileName } from '../../../storage/index.ts';

export type FileValidationOptions = {
	allowedFileExtensions: string[];
	allowedMimeTypes?: string[];
	maxFileSizeBytes: number;
	maxFileSizeLabel?: string;
	maxFilesPerUpload: number;
	maxTotalUploadSizeBytes: number;
	uploadFormHref?: string;
	validationMessages?: FileUploaderValidationMessages;
};

export type FileValidationError = {
	text: string;
	href: string;
};

const DEFAULT_UPLOAD_FORM_HREF = '#upload-form';

export function normaliseExtension(extension: string): string {
	return extension.trim().replace(/^\./, '').toLowerCase();
}

export function getFileExtension(fileName: string): string {
	const extension = fileName.split('.').pop();
	return extension ? normaliseExtension(extension) : '';
}

export function validateFiles(
	files: UploadedRequestFile[],
	existingFiles: UploadedFile[],
	options: FileValidationOptions
): FileValidationError[] {
	const href = options.uploadFormHref ?? DEFAULT_UPLOAD_FORM_HREF;
	const messages = options.validationMessages ?? {};
	const errors: FileValidationError[] = [];
	const allowedExtensions = options.allowedFileExtensions.map(normaliseExtension);
	const allowedMimeTypes = options.allowedMimeTypes ?? [];

	if (files.length === 0) {
		errors.push({ text: messages.noFile ?? 'Choose a file to upload', href });
	}

	if (files.length > options.maxFilesPerUpload) {
		errors.push({ text: `You can only upload up to ${options.maxFilesPerUpload} files at a time`, href });
	} else if (existingFiles.length > 0 && existingFiles.length + files.length > options.maxFilesPerUpload) {
		errors.push({ text: `You can only upload up to ${options.maxFilesPerUpload} files in total`, href });
	}

	for (const file of files) {
		const extension = getFileExtension(file.originalname);
		const isAllowedExtension = allowedExtensions.includes(extension);
		const isAllowedMimeType = allowedMimeTypes.length === 0 || allowedMimeTypes.includes(file.mimetype);

		if (!isAllowedExtension || !isAllowedMimeType) {
			const extensionList = options.allowedFileExtensions.map((ext) => ext.toUpperCase()).join(', ');
			errors.push({ text: messages.incompatibleFileType ?? `The selected file must be ${extensionList}`, href });
		}

		if (file.size > options.maxFileSizeBytes) {
			const sizeLabel = options.maxFileSizeLabel ?? formatBytes(options.maxFileSizeBytes);
			errors.push({ text: messages.fileTooLarge ?? `The selected file must be smaller than ${sizeLabel}`, href });
		}
	}

	const existingNames = new Set(existingFiles.map((file) => file.fileName.toLowerCase()));
	for (const file of files) {
		if (existingNames.has(sanitiseFileName(file.originalname).toLowerCase())) {
			errors.push({ text: `${file.originalname} has already been uploaded`, href });
		}
	}

	const totalUploadedSize = existingFiles.reduce((sum, file) => sum + file.size, 0);
	const totalNewSize = files.reduce((sum, file) => sum + file.size, 0);
	if (totalUploadedSize + totalNewSize > options.maxTotalUploadSizeBytes) {
		errors.push({ text: messages.totalFileSizeTooLarge ?? 'The total size of uploaded files is too large', href });
	}

	return errors;
}

function formatBytes(bytes: number): string {
	if (bytes >= 1024 * 1024 * 1024) {
		return `${Math.round(bytes / (1024 * 1024 * 1024))}GB`;
	}
	if (bytes >= 1024 * 1024) {
		return `${Math.round(bytes / (1024 * 1024))}MB`;
	}
	if (bytes >= 1024) {
		return `${Math.round(bytes / 1024)}KB`;
	}
	return `${bytes}B`;
}
