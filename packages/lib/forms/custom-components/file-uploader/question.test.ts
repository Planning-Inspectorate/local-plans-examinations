import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import FileUploaderQuestion, { fileUploadBulletListFormat, fileUploadCountFormat } from './question.ts';

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

	it('formats one uploaded file as a download link', () => {
		const question = buildQuestion();

		const [row] = question.formatAnswerForSummary('section', buildJourney(), [
			{ id: 'file-1', fileName: 'cover-letter.pdf' }
		]);

		assert.equal(
			row.value,
			'<a class="govuk-link" href="/case/PLAN-123456/download-case-document/file-1">cover-letter.pdf</a>'
		);
	});

	it('formats multiple uploaded files as a bullet list of links when valueDisplayFormat is set to items', () => {
		const question = buildQuestion({ formatSummaryValue: fileUploadBulletListFormat });

		const [row] = question.formatAnswerForSummary('section', buildJourney(), [
			{ id: 'file-1', fileName: 'beach.jpg' },
			{ id: 'file-2', fileName: 'bridge.jpg' },
			{ id: 'file-3', fileName: 'bullfrog.jpg' }
		]);

		assert.equal(
			row.value,
			'<ul class="govuk-list--bullet li"><li><a class="govuk-link" href="/case/PLAN-123456/download-case-document/file-1">beach.jpg</a></li><li><a class="govuk-link" href="/case/PLAN-123456/download-case-document/file-2">bridge.jpg</a></li><li><a class="govuk-link" href="/case/PLAN-123456/download-case-document/file-3">bullfrog.jpg</a></li></ul>'
		);
	});
	it('formats multiple uploaded files as a count of the files when valueDisplayFormat is set to count', () => {
		const question = buildQuestion({ formatSummaryValue: fileUploadCountFormat });

		const [row] = question.formatAnswerForSummary('section', buildJourney(), [
			{ id: 'file-1', fileName: 'beach.jpg' },
			{ id: 'file-2', fileName: 'bridge.jpg' },
			{ id: 'file-3', fileName: 'bullfrog.jpg' }
		]);

		assert.equal(row.value, '<ul class="govuk-list">3 documents</ul>');
	});

	it('escapes uploaded file names before rendering summary HTML', () => {
		const question = buildQuestion();

		const [row] = question.formatAnswerForSummary('section', buildJourney(), [
			{ id: 'file-1', fileName: '<script>alert("x")</script>.pdf' },
			{ id: 'file-2', fileName: 'safe.pdf' }
		]);

		assert.equal(
			row.value,
			'<ul class="govuk-list--bullet li"><li><a class="govuk-link" href="/case/PLAN-123456/download-case-document/file-1">&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;.pdf</a></li><li><a class="govuk-link" href="/case/PLAN-123456/download-case-document/file-2">safe.pdf</a></li></ul>'
		);
	});

	it('returns a view model when there are validation errors', () => {
		const question = buildQuestion();
		const viewModel = {};
		question.toViewModel = () => viewModel as any;

		const result = question.checkForValidationErrors(
			{
				body: {
					errorSummary: ['error'],
					errors: { documents: 'error' }
				},
				session: {},
				originalUrl: '/documents',
				params: {}
			} as any,
			'section',
			buildJourney() as any
		);
		assert.equal(result, viewModel);
	});
});

function buildJourney() {
	return {
		getCurrentQuestionUrl: () => '/section/documents',
		caseReference: 'PLAN-123456'
	};
}

function buildQuestion(overrides = {}) {
	return new FileUploaderQuestion({
		title: 'Documents',
		question: 'Upload documents',
		fieldName: 'documents',
		allowedFileExtensions: ['pdf'],
		allowedMimeTypes: ['application/pdf'],
		maxFileSizeBytes: 1000,
		maxFileSizeLabel: '1KB',
		maxTotalUploadSizeBytes: 2000,
		maxTotalUploadSizeLabel: '2KB',
		formatSummaryValue: fileUploadBulletListFormat,
		actionButtonVisibleInSummary: true,
		...overrides
	});
}
