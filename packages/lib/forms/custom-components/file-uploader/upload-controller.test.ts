import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import {
	createFileUploaderDeleteController,
	createFileUploaderUploadController,
	isSafeLocalRedirect
} from './upload-controller.ts';
import type { FileUploadDestination, FileUploadStorageAdapter, UploadedFile, UploadedRequestFile } from './types.ts';

describe('file uploader upload controller', () => {
	it('validates, stores uploaded files and appends them to the session', async () => {
		const file = buildRequestFile();
		const uploadedFile = buildUploadedFile({ id: 'stored-file-1', fileName: 'stored-cover-letter.pdf' });
		const upload = mock.fn(async () => uploadedFile);
		const onFilesChange = mock.fn();
		const storage = buildStorage({ upload });
		const controller = createFileUploaderUploadController({
			fieldName: 'documents',
			sessionKey: 'gatewayDocuments',
			storage: async () => storage,
			destination: async () => ({ folderPath: 'cases/case-1', metadata: { caseId: 1 } }),
			redirect: '/case/gateway-2',
			onFilesChange,
			question: buildQuestionConfig()
		});
		const req = buildRequest({
			files: [file],
			session: {
				fileUploader: {
					gatewayDocuments: {
						uploadedFiles: [buildUploadedFile({ id: 'existing-file-1', fileName: 'existing.pdf' })]
					}
				},
				errors: { 'upload-form': { msg: 'Old upload error' } },
				errorSummary: [{ text: 'Old upload error', href: '#upload-form' }]
			}
		});
		const res = buildResponse();

		await controller(req, res, mock.fn());

		assert.equal(upload.mock.callCount(), 1);
		assert.deepEqual(upload.mock.calls[0].arguments, [
			file,
			{ folderPath: 'cases/case-1', metadata: { caseId: 1 } } satisfies FileUploadDestination
		]);
		assert.deepEqual(req.session.fileUploader.gatewayDocuments.uploadedFiles, [
			buildUploadedFile({ id: 'existing-file-1', fileName: 'existing.pdf' }),
			uploadedFile
		]);
		assert.equal(onFilesChange.mock.callCount(), 1);
		assert.deepEqual(onFilesChange.mock.calls[0].arguments, [
			{
				req,
				sessionKey: 'gatewayDocuments',
				fieldName: 'documents',
				uploadedFiles: [buildUploadedFile({ id: 'existing-file-1', fileName: 'existing.pdf' }), uploadedFile]
			}
		]);
		assert.equal(req.session.errors, undefined);
		assert.equal(req.session.errorSummary, undefined);
		assert.deepEqual(res.redirect.mock.calls[0].arguments, ['/case/gateway-2']);
	});

	it('stores validation errors in the session and redirects without uploading', async () => {
		const upload = mock.fn(async () => buildUploadedFile());
		const onUploadError = mock.fn();
		const controller = createFileUploaderUploadController({
			fieldName: 'documents',
			storage: async () => buildStorage({ upload }),
			onUploadError,
			question: buildQuestionConfig()
		});
		const req = buildRequest({
			files: [],
			originalUrl: '/case/gateway-2/upload-documents',
			referer: undefined
		});
		const res = buildResponse();

		await controller(req, res, mock.fn());

		assert.equal(upload.mock.callCount(), 0);
		assert.equal(onUploadError.mock.callCount(), 1);
		assert.deepEqual(onUploadError.mock.calls[0].arguments, [
			{
				req,
				sessionKey: 'documents',
				fieldName: 'documents',
				errors: [{ text: 'Choose a file to upload', href: '#upload-form' }]
			}
		]);
		assert.deepEqual(req.session.errors, { 'upload-form': { msg: 'Errors encountered during file upload' } });
		assert.deepEqual(req.session.errorSummary, [{ text: 'Choose a file to upload', href: '#upload-form' }]);
		// Commented out due to GH security alert, will look at removing / resolving with the cover letter release
		// assert.deepEqual(res.redirect.mock.calls[0].arguments, ['/case/gateway-2']);
	});

	it('calls the upload error callback and rethrows when storage upload fails', async () => {
		const error = new Error('storage failed');
		const upload = mock.fn(async () => {
			throw error;
		});
		const onUploadError = mock.fn();
		const controller = createFileUploaderUploadController({
			fieldName: 'documents',
			storage: async () => buildStorage({ upload }),
			onUploadError,
			question: buildQuestionConfig()
		});
		const req = buildRequest();
		const res = buildResponse();

		await assert.rejects(() => controller(req, res, mock.fn()), error);

		assert.equal(onUploadError.mock.callCount(), 1);
		assert.deepEqual(onUploadError.mock.calls[0].arguments, [
			{
				req,
				sessionKey: 'documents',
				fieldName: 'documents',
				error
			}
		]);
		assert.equal(res.redirect.mock.callCount(), 0);
	});
});

describe('file uploader delete controller', () => {
	it('deletes the stored file and removes it from the session', async () => {
		const deleteFile = mock.fn(async () => undefined);
		const onFilesChange = mock.fn();
		const storage = buildStorage({ delete: deleteFile });
		const controller = createFileUploaderDeleteController({
			fieldName: 'documents',
			storage: async () => storage,
			redirect: (req) => `/case/${req.params.caseId}`,
			onFilesChange,
			question: buildQuestionConfig()
		});
		const fileToDelete = buildUploadedFile({ id: 'file-to-delete' });
		const fileToKeep = buildUploadedFile({ id: 'file-to-keep' });
		const req = buildRequest({
			params: { caseId: 'case-1', fileId: 'file-to-delete' },
			session: {
				fileUploader: {
					documents: {
						uploadedFiles: [fileToDelete, fileToKeep]
					}
				}
			}
		});
		const res = buildResponse();

		await controller(req, res, mock.fn());

		assert.equal(deleteFile.mock.callCount(), 1);
		assert.deepEqual(deleteFile.mock.calls[0].arguments, [fileToDelete]);
		assert.deepEqual(req.session.fileUploader.documents.uploadedFiles, [fileToKeep]);
		assert.equal(onFilesChange.mock.callCount(), 1);
		assert.deepEqual(onFilesChange.mock.calls[0].arguments, [
			{
				req,
				sessionKey: 'documents',
				fieldName: 'documents',
				uploadedFiles: [fileToKeep]
			}
		]);
		assert.deepEqual(res.redirect.mock.calls[0].arguments, ['/case/case-1']);
	});

	it('calls the delete error callback and rethrows when storage delete fails', async () => {
		const error = new Error('delete failed');
		const deleteFile = mock.fn(async () => {
			throw error;
		});
		const onDeleteError = mock.fn();
		const fileToDelete = buildUploadedFile({ id: 'file-to-delete' });
		const controller = createFileUploaderDeleteController({
			fieldName: 'documents',
			storage: async () => buildStorage({ delete: deleteFile }),
			onDeleteError,
			question: buildQuestionConfig()
		});
		const req = buildRequest({
			params: { fileId: 'file-to-delete' },
			session: {
				fileUploader: {
					documents: {
						uploadedFiles: [fileToDelete]
					}
				}
			}
		});
		const res = buildResponse();

		await assert.rejects(() => controller(req, res, mock.fn()), error);

		assert.equal(onDeleteError.mock.callCount(), 1);
		assert.deepEqual(onDeleteError.mock.calls[0].arguments, [
			{
				req,
				sessionKey: 'documents',
				fieldName: 'documents',
				fileId: 'file-to-delete',
				error
			}
		]);
		assert.deepEqual(req.session.fileUploader.documents.uploadedFiles, [fileToDelete]);
		assert.equal(res.redirect.mock.callCount(), 0);
	});
});

describe('isSafeLocalRedirect', () => {
	it('allows local redirect paths', () => {
		assert.equal(isSafeLocalRedirect('/'), true);
		assert.equal(isSafeLocalRedirect('/case/gateway-2'), true);
		assert.equal(isSafeLocalRedirect('/case/gateway-2?tab=documents#upload-form'), true);
	});

	it('rejects empty, relative and external redirect targets', () => {
		assert.equal(isSafeLocalRedirect(''), false);
		assert.equal(isSafeLocalRedirect('case/gateway-2'), false);
		assert.equal(isSafeLocalRedirect('//example.com/phishing'), false);
		assert.equal(isSafeLocalRedirect('https://example.com/phishing'), false);
		assert.equal(isSafeLocalRedirect('javascript:alert(1)'), false);
	});
});

function buildQuestionConfig() {
	return {
		allowedFileExtensions: ['pdf'],
		allowedMimeTypes: ['application/pdf'],
		maxFileSizeBytes: 1000,
		maxFileSizeLabel: '250MB',
		maxFilesPerUpload: 3,
		maxTotalUploadSizeBytes: 2000,
		multiple: true
	};
}

function buildRequestFile(overrides: Partial<UploadedRequestFile> = {}): UploadedRequestFile {
	return {
		originalname: 'cover-letter.pdf',
		mimetype: 'application/pdf',
		size: 100,
		buffer: Buffer.from('file'),
		...overrides
	};
}

function buildUploadedFile(overrides: Partial<UploadedFile> = {}): UploadedFile {
	return {
		id: 'file-1',
		fileName: 'cover-letter.pdf',
		mimeType: 'application/pdf',
		size: 100,
		storageProvider: 'blob',
		...overrides
	};
}

function buildStorage(overrides: Partial<FileUploadStorageAdapter> = {}): FileUploadStorageAdapter {
	return {
		provider: 'blob',
		upload: async () => buildUploadedFile(),
		...overrides
	};
}

function buildRequest(overrides: Record<string, any> = {}) {
	const req = {
		files: [buildRequestFile()],
		params: {},
		originalUrl: '/case/gateway-2',
		session: {},
		get(header: string) {
			return header.toLowerCase() === 'referer' ? '/previous-page' : undefined;
		},
		...overrides
	};

	if ('referer' in overrides) {
		req.get = (header: string) => (header.toLowerCase() === 'referer' ? overrides.referer : undefined);
	}

	return req as any;
}

function buildResponse() {
	return {
		redirect: mock.fn()
	} as any;
}
