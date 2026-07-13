import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validationResult } from 'express-validator';
import { RequiredValidator } from '@planning-inspectorate/dynamic-forms';
import FileUploadRequiredValidator from './required-validator.ts';

describe('FileUploadRequiredValidator', () => {
	it('counts as a required validator for journey completion', () => {
		const validator = new FileUploadRequiredValidator('documents');

		assert.equal(validator instanceof RequiredValidator, true);
	});

	it('passes when the encoded uploaded files value contains at least one file', async () => {
		const validator = new FileUploadRequiredValidator('documents');
		const req = {
			body: {
				documents: encodeUploadedFiles([{ id: 'file-1', fileName: 'cover-letter.pdf' }])
			}
		};

		await validator.validate().run(req);

		assert.equal(validationResult(req).isEmpty(), true);
	});

	it('returns the configured error when no files have been uploaded', async () => {
		const validator = new FileUploadRequiredValidator('documents', 'Upload supporting documents');
		const req = {
			body: {
				documents: encodeUploadedFiles([])
			}
		};

		await validator.validate().run(req);
		const result = validationResult(req);

		assert.equal(result.isEmpty(), false);
		assert.equal(result.array()[0].msg, 'Upload supporting documents');
	});
});

function encodeUploadedFiles(value: unknown): string {
	return Buffer.from(JSON.stringify(value), 'utf-8').toString('base64');
}
