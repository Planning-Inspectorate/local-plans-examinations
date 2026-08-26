import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { UploadedFile, UploadedRequestFile } from './types.ts';
import { getFileExtension, normaliseExtension, validateFiles } from './validation.ts';

describe('file uploader validation', () => {
	describe('normaliseExtension', () => {
		it('trims, lowercases and removes a leading dot', () => {
			assert.equal(normaliseExtension(' .PDF '), 'pdf');
		});
	});

	describe('getFileExtension', () => {
		it('returns the normalised extension from the filename', () => {
			assert.equal(getFileExtension('Gateway 2 Cover Letter.PDF'), 'pdf');
		});
	});

	describe('validateFiles', () => {
		it('returns no errors for valid files', () => {
			const errors = validateFiles(
				[buildRequestFile({ originalname: 'cover-letter.pdf', mimetype: 'application/pdf', size: 100 })],
				[],
				buildValidationOptions()
			);

			assert.deepEqual(errors, []);
		});

		it('requires at least one file', () => {
			const errors = validateFiles([], [], buildValidationOptions());

			assert.deepEqual(errors, [{ text: 'Choose a file to upload', href: '#upload-form' }]);
		});

		it('validates extension, MIME type, file size and number of files', () => {
			const errors = validateFiles(
				[
					buildRequestFile({ originalname: 'cover-letter.exe', mimetype: 'application/x-msdownload', size: 2000 }),
					buildRequestFile({ originalname: 'report.docx', mimetype: 'application/pdf', size: 100 })
				],
				[],
				buildValidationOptions({ maxFilesPerUpload: 1, maxFileSizeBytes: 1000, maxTotalUploadSizeBytes: 5000 })
			);

			assert.deepEqual(errors, [
				{ text: 'You can only upload up to 1 files at a time', href: '#upload-form' },
				{ text: 'The selected file must be PDF, DOC', href: '#upload-form' },
				{ text: 'The selected file must be smaller than 1000B', href: '#upload-form' },
				{ text: 'The selected file must be PDF, DOC', href: '#upload-form' }
			]);
		});

		it('detects duplicate filenames after sanitising request filenames', () => {
			const errors = validateFiles(
				[buildRequestFile({ originalname: 'cover?letter.pdf', mimetype: 'application/pdf', size: 100 })],
				[buildUploadedFile({ fileName: 'cover_letter.pdf' })],
				buildValidationOptions()
			);

			assert.deepEqual(errors, [{ text: 'cover?letter.pdf has already been uploaded', href: '#upload-form' }]);
		});

		it('validates total number of files across existing and new files', () => {
			const errors = validateFiles(
				[buildRequestFile({ originalname: 'replacement.pdf', mimetype: 'application/pdf', size: 100 })],
				[buildUploadedFile({ fileName: 'existing.pdf' })],
				buildValidationOptions({ maxFilesPerUpload: 1 })
			);

			assert.deepEqual(errors, [{ text: 'You can only upload up to 1 files in total', href: '#upload-form' }]);
		});

		it('returns only the per-upload file limit when both file count limits are exceeded', () => {
			const errors = validateFiles(
				[
					buildRequestFile({ originalname: 'cover-letter.pdf', mimetype: 'application/pdf', size: 100 }),
					buildRequestFile({ originalname: 'replacement.pdf', mimetype: 'application/pdf', size: 100 })
				],
				[buildUploadedFile({ fileName: 'existing.pdf' })],
				buildValidationOptions({ maxFilesPerUpload: 1 })
			);

			assert.deepEqual(errors, [{ text: 'You can only upload up to 1 files at a time', href: '#upload-form' }]);
		});

		it('validates total upload size across existing and new files', () => {
			const errors = validateFiles(
				[buildRequestFile({ originalname: 'cover-letter.pdf', mimetype: 'application/pdf', size: 600 })],
				[buildUploadedFile({ fileName: 'existing.pdf', size: 500 })],
				buildValidationOptions({ maxTotalUploadSizeBytes: 1000, uploadFormHref: '#documents' })
			);

			assert.deepEqual(errors, [{ text: 'The total size of uploaded files is too large', href: '#documents' }]);
		});

		it('uses custom validation messages when provided', () => {
			const noFileErrors = validateFiles(
				[],
				[],
				buildValidationOptions({
					validationMessages: {
						noFile: 'Please upload your Gateway 2 report'
					}
				})
			);
			const errors = validateFiles(
				[buildRequestFile({ originalname: 'cover-letter.exe', mimetype: 'application/x-msdownload', size: 2000 })],
				[buildUploadedFile({ fileName: 'existing.pdf', size: 500 })],
				buildValidationOptions({
					maxFileSizeBytes: 1000,
					maxTotalUploadSizeBytes: 1000,
					validationMessages: {
						incompatibleFileType: 'Please upload a compatible file type',
						fileTooLarge: 'File too large',
						totalFileSizeTooLarge: 'Total file size is too large'
					}
				})
			);

			assert.deepEqual(noFileErrors, [{ text: 'Please upload your Gateway 2 report', href: '#upload-form' }]);
			assert.deepEqual(errors, [
				{ text: 'Please upload a compatible file type', href: '#upload-form' },
				{ text: 'File too large', href: '#upload-form' },
				{ text: 'Total file size is too large', href: '#upload-form' }
			]);
		});
	});
});

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

function buildValidationOptions(
	overrides: Partial<Parameters<typeof validateFiles>[2]> = {}
): Parameters<typeof validateFiles>[2] {
	return {
		allowedFileExtensions: ['pdf', 'doc'],
		allowedMimeTypes: ['application/pdf'],
		maxFileSizeBytes: 1000,
		maxFilesPerUpload: 3,
		maxTotalUploadSizeBytes: 2000,
		...overrides
	};
}
