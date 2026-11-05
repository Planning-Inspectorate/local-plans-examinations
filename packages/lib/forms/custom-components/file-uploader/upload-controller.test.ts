import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import {
	createFileUploaderDeleteController,
	createFileUploaderUploadController,
	createFileSubmitUploadController,
	isSafeLocalRedirect
} from './upload-controller.ts';
import FileUploadRequiredValidator from './required-validator.ts';
import type { FileUploadDestination, FileUploadStorageAdapter, UploadedFile, UploadedRequestFile } from './types.ts';

describe('file uploader upload controller', () => {
	it('keeps the case ID for cleanup when adding another upload batch after reloading', async () => {
		const existingFile = buildUploadedFile({
			id: 'existing-file',
			fileName: 'existing.pdf',
			metadata: { documentGuid: 'document-1' }
		});
		const newFile = buildUploadedFile({ id: 'new-file', metadata: { caseId: 'case-1' } });
		const controller = createFileUploaderUploadController({
			fieldName: 'documents',
			storage: async () => buildStorage({ upload: async () => newFile }),
			question: { ...buildQuestionConfig(), url: 'signed-sla' }
		});
		const req = buildRequest({
			session: {
				id: 'session-1',
				fileUploader: { documents: { uploadedFiles: [existingFile] } }
			}
		});

		await controller(req, buildResponse(), mock.fn());

		assert.deepEqual(req.session.hasTempDocuments['session-1'], {
			question: 'signed-sla',
			caseId: 'case-1',
			hasUploadedFiles: true
		});
		assert.deepEqual(req.session.fileUploader.documents.uploadedFiles, [existingFile, newFile]);
	});

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
		assert.deepEqual(req.session.errors, { 'upload-form': { msg: 'Choose a file to upload' } });
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

	it('deletes newly uploaded files and rethrows when persisting uploaded files fails', async () => {
		const persistenceError = new Error('database failed');
		const existingFile = buildUploadedFile({ id: 'existing-file', fileName: 'existing.pdf' });
		const uploadedFile = buildUploadedFile({ id: 'new-file', fileName: 'new.pdf' });
		const upload = mock.fn(async () => uploadedFile);
		const deleteFile = mock.fn(async () => undefined);
		const onFilesChange = mock.fn(async () => {
			throw persistenceError;
		});
		const onUploadError = mock.fn();
		const controller = createFileUploaderUploadController({
			fieldName: 'documents',
			storage: async () => buildStorage({ upload, delete: deleteFile }),
			onFilesChange,
			onUploadError,
			question: buildQuestionConfig()
		});
		const req = buildRequest({
			session: {
				fileUploader: {
					documents: {
						uploadedFiles: [existingFile]
					}
				}
			}
		});
		const res = buildResponse();

		await assert.rejects(() => controller(req, res, mock.fn()), persistenceError);

		assert.equal(deleteFile.mock.callCount(), 1);
		assert.deepEqual(deleteFile.mock.calls[0].arguments, [uploadedFile]);
		assert.deepEqual(req.session.fileUploader.documents.uploadedFiles, [existingFile]);
		assert.equal(onUploadError.mock.callCount(), 1);
		assert.deepEqual(onUploadError.mock.calls[0].arguments, [
			{
				req,
				sessionKey: 'documents',
				fieldName: 'documents',
				error: persistenceError
			}
		]);
		assert.equal(res.redirect.mock.callCount(), 0);
	});

	it('does not replace the persistence error when uploaded file cleanup fails', async () => {
		const persistenceError = new Error('database failed');
		const cleanupError = new Error('cleanup failed');
		const existingFile = buildUploadedFile({ id: 'existing-file', fileName: 'existing.pdf' });
		const uploadedFile = buildUploadedFile({ id: 'new-file', fileName: 'new.pdf' });
		const upload = mock.fn(async () => uploadedFile);
		const deleteFile = mock.fn(async () => {
			throw cleanupError;
		});
		const onUploadCleanupError = mock.fn();
		const controller = createFileUploaderUploadController({
			fieldName: 'documents',
			storage: async () => buildStorage({ upload, delete: deleteFile }),
			onFilesChange: async () => {
				throw persistenceError;
			},
			onUploadCleanupError,
			question: buildQuestionConfig()
		});
		const req = buildRequest({
			session: {
				fileUploader: {
					documents: {
						uploadedFiles: [existingFile]
					}
				}
			}
		});
		const res = buildResponse();

		await assert.rejects(() => controller(req, res, mock.fn()), persistenceError);

		assert.equal(deleteFile.mock.callCount(), 1);
		assert.deepEqual(deleteFile.mock.calls[0].arguments, [uploadedFile]);
		assert.deepEqual(onUploadCleanupError.mock.calls[0].arguments, [
			{
				req,
				sessionKey: 'documents',
				fieldName: 'documents',
				file: uploadedFile,
				error: cleanupError
			}
		]);
		assert.deepEqual(req.session.fileUploader.documents.uploadedFiles, [existingFile]);
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
				fileId: 'file-to-delete',
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

	it('does not delete the stored file or update the session when persisting the delete fails', async () => {
		const persistenceError = new Error('database failed');
		const deleteFile = mock.fn(async () => undefined);
		const onDeleteError = mock.fn();
		const fileToDelete = buildUploadedFile({ id: 'file-to-delete' });
		const fileToKeep = buildUploadedFile({ id: 'file-to-keep' });
		const controller = createFileUploaderDeleteController({
			fieldName: 'documents',
			storage: async () => buildStorage({ delete: deleteFile }),
			onFilesChange: async () => {
				throw persistenceError;
			},
			onDeleteError,
			question: buildQuestionConfig()
		});
		const req = buildRequest({
			params: { fileId: 'file-to-delete' },
			session: {
				fileUploader: {
					documents: {
						uploadedFiles: [fileToDelete, fileToKeep]
					}
				}
			}
		});
		const res = buildResponse();

		await assert.rejects(() => controller(req, res, mock.fn()), persistenceError);

		assert.equal(deleteFile.mock.callCount(), 0);
		assert.deepEqual(onDeleteError.mock.calls[0].arguments, [
			{
				req,
				sessionKey: 'documents',
				fieldName: 'documents',
				fileId: 'file-to-delete',
				error: persistenceError
			}
		]);
		assert.deepEqual(req.session.fileUploader.documents.uploadedFiles, [fileToDelete, fileToKeep]);
		assert.equal(res.redirect.mock.callCount(), 0);
	});
});

describe('file uploader submit controller', () => {
	for (const [fieldName, url, message] of [
		['signedSla', 'signed-sla', 'Upload at least one signed SLA document before continuing'],
		['gateway2Report', 'gateway-2-report', 'Please upload your Gateway 2 report'],
		[
			'gateway2WorkshopDocuments',
			'gateway-2-workshop-documents',
			'Upload at least one tbd workshop document before continuing'
		],
		['gateway3Documents-1', 'gateway-3-document-1', 'Please upload your Gateway 3 report']
	]) {
		it(`uses the configured required-file message for ${url}`, async () => {
			const onSubmit = mock.fn();
			const controller = createFileSubmitUploadController({
				fieldName,
				storage: async () => buildStorage(),
				redirect: '/upload',
				question: {
					...buildQuestionConfig(),
					url,
					validators: [new FileUploadRequiredValidator(fieldName, message)]
				},
				onSubmit
			});
			const req = buildRequest({ url: '/gateway-2/workshop/upload-documents/submit' });
			const res = buildResponse();

			await controller(req, res, mock.fn());

			assert.deepEqual(req.session.errors, { 'upload-form': { msg: message } });
			assert.deepEqual(req.session.errorSummary, [{ href: '#upload-form', text: message }]);
			assert.equal(onSubmit.mock.callCount(), 0);
			assert.deepEqual(res.redirect.mock.calls[0].arguments, ['/upload']);
		});
	}

	it('prefers the upload-specific no-file message when configured', async () => {
		const controller = createFileSubmitUploadController({
			fieldName: 'documents',
			storage: async () => buildStorage(),
			question: {
				...buildQuestionConfig(),
				validationMessages: { noFile: 'Choose a workshop document' }
			}
		});
		const req = buildRequest({ url: '/gateway-2/workshop/upload-documents/submit' });

		await controller(req, buildResponse(), mock.fn());

		assert.equal(req.session.errors['upload-form'].msg, 'Choose a workshop document');
	});

	it('submits the uploaded files without setting validation errors', async () => {
		const onSubmit = mock.fn();
		const file = buildUploadedFile();
		const controller = createFileSubmitUploadController({
			fieldName: 'documents',
			storage: async () => buildStorage(),
			question: buildQuestionConfig(),
			onSubmit,
			redirect: '/check'
		});
		const req = buildRequest({
			url: '/gateway-2/report/upload-documents/submit',
			session: { id: 'session-1', fileUploader: { documents: { uploadedFiles: [file] } } }
		});
		const res = buildResponse();

		await controller(req, res, mock.fn());

		assert.deepEqual(onSubmit.mock.calls[0].arguments, [{ req, fieldName: 'documents', uploadedFiles: [file] }]);
		assert.equal(req.session.errors, undefined);
		assert.equal(req.session.hasTempDocuments['session-1'].hasUploadedFiles, false);
		assert.deepEqual(res.redirect.mock.calls[0].arguments, ['/check']);
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
		maxFilesPerUpload: 3,
		maxTotalUploadSizeBytes: 2000
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
