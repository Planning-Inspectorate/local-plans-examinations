import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import FileUploaderQuestion from './question.ts';

describe('FileUploaderQuestion', () => {
	it('is not answered when the uploaded files answer is missing', () => {
		const question = buildQuestion();

		assert.equal(question.isAnswered({ answers: {} }), false);
	});

	it('is not answered when the uploaded files answer is empty', () => {
		const question = buildQuestion();

		assert.equal(question.isAnswered({ answers: { documents: [] } }), false);
	});

	it('is answered when the uploaded files answer contains at least one file', () => {
		const question = buildQuestion();

		assert.equal(
			question.isAnswered({ answers: { documents: [{ id: 'file-1', fileName: 'cover-letter.pdf' }] } }),
			true
		);
	});
});

function buildQuestion() {
	return new FileUploaderQuestion({
		title: 'Documents',
		question: 'Upload documents',
		fieldName: 'documents',
		allowedFileExtensions: ['pdf'],
		allowedMimeTypes: ['application/pdf'],
		maxFileSizeBytes: 1000,
		maxFileSizeLabel: '1KB',
		maxTotalUploadSizeBytes: 2000,
		maxTotalUploadSizeLabel: '2KB'
	});
}
