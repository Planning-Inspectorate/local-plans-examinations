import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import FileUploaderQuestion from './question.ts';

describe('FileUploaderQuestion', () => {
	it('is not answered when the uploaded files answer is missing', () => {
		const question = buildQuestion();

		assert.equal(question.isAnswered({ answers: {} }), false);
	});

	it('uses the shared file uploader Nunjucks template', () => {
		const question = buildQuestion();

		assert.equal(question.viewFolder, 'forms/custom-components/file-uploader');
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

	it('formats a missing file upload answer as not started', () => {
		const question = buildQuestion();

		const [row] = question.formatAnswerForSummary('section', buildJourney(), []);

		assert.equal(row.value, 'Not started');
	});

	it('formats one uploaded file as plain escaped text', () => {
		const question = buildQuestion();

		const [row] = question.formatAnswerForSummary('section', buildJourney(), [
			{ id: 'file-1', fileName: 'cover-letter.pdf' }
		]);

		assert.equal(row.value, 'cover-letter.pdf');
	});

	it('formats multiple uploaded files as a bullet list', () => {
		const question = buildQuestion();

		const [row] = question.formatAnswerForSummary('section', buildJourney(), [
			{ id: 'file-1', fileName: 'beach.jpg' },
			{ id: 'file-2', fileName: 'bridge.jpg' },
			{ id: 'file-3', fileName: 'bullfrog.jpg' }
		]);

		assert.equal(row.value, '<ul class="govuk-list"><li>beach.jpg</li><li>bridge.jpg</li><li>bullfrog.jpg</li></ul>');
	});

	it('escapes uploaded file names before rendering summary HTML', () => {
		const question = buildQuestion();

		const [row] = question.formatAnswerForSummary('section', buildJourney(), [
			{ id: 'file-1', fileName: '<script>alert("x")</script>.pdf' },
			{ id: 'file-2', fileName: 'safe.pdf' }
		]);

		assert.equal(
			row.value,
			'<ul class="govuk-list"><li>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;.pdf</li><li>safe.pdf</li></ul>'
		);
	});
});

function buildJourney() {
	return {
		getCurrentQuestionUrl: () => '/section/documents'
	};
}

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
