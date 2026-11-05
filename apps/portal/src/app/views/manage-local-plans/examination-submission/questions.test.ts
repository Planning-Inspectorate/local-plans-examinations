import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createDownloadDocumentSummaryFormatter, EXAMINATION_FILE_UPLOAD_QUESTIONS } from './questions.ts';

describe('examination file upload questions', () => {
	it('has no caption and uses Upload a file as the introduction', () => {
		for (const question of Object.values(EXAMINATION_FILE_UPLOAD_QUESTIONS)) {
			assert.equal(question.text.caption, undefined);
			assert.equal(question.text.introduction, 'Upload a file');
		}
	});
});

describe('createDownloadDocumentSummaryFormatter', () => {
	const fallback = 'Uploaded documents';

	it('returns the formatted answer when a downloadable link cannot be built', () => {
		const withoutPlanReference = createDownloadDocumentSummaryFormatter(undefined);
		const withPlanReference = createDownloadDocumentSummaryFormatter('PLAN-61797');

		assert.equal(
			withoutPlanReference({
				formattedAnswer: fallback,
				answer: [{ fileName: 'plan.pdf', metadata: { documentGuid: 'document-guid' } }]
			}),
			fallback
		);
		assert.equal(withPlanReference({ formattedAnswer: fallback, answer: [] }), fallback);
		assert.equal(
			withPlanReference({ formattedAnswer: fallback, answer: [{ fileName: 'plan.pdf', metadata: {} }] }),
			fallback
		);
	});

	it('formats a single document as an encoded download link', () => {
		const formatter = createDownloadDocumentSummaryFormatter('PLAN 61797/1');

		const result = formatter({
			formattedAnswer: fallback,
			answer: [{ fileName: 'local%20plan.pdf', metadata: { documentGuid: 'document guid' } }]
		});

		assert.equal(
			result,
			'<a href="/manage-local-plans/PLAN%2061797%2F1/examination/download-document/document%20guid">local plan.pdf</a>'
		);
	});

	it('uses the formatted answer when the file name is missing', () => {
		const formatter = createDownloadDocumentSummaryFormatter('PLAN-61797');

		const result = formatter({
			formattedAnswer: fallback,
			answer: [{ metadata: { documentGuid: 'document-guid' } }]
		});

		assert.equal(
			result,
			'<a href="/manage-local-plans/PLAN-61797/examination/download-document/document-guid">Uploaded documents</a>'
		);
	});

	it('formats multiple documents as a bulleted list', () => {
		const formatter = createDownloadDocumentSummaryFormatter('PLAN-61797');

		const result = formatter({
			formattedAnswer: fallback,
			answer: [
				{ fileName: 'plan.pdf', metadata: { documentGuid: 'document-1' } },
				{ fileName: 'map%20of%20policies.pdf', metadata: { documentGuid: 'document-2' } }
			]
		});

		assert.equal(
			result,
			'<ul class="govuk-list govuk-list--bullet"><li><a href="/manage-local-plans/PLAN-61797/examination/download-document/document-1">plan.pdf</a></li><li><a href="/manage-local-plans/PLAN-61797/examination/download-document/document-2">map of policies.pdf</a></li></ul>'
		);
	});

	it('keeps a malformed encoded file name unchanged', () => {
		const formatter = createDownloadDocumentSummaryFormatter('PLAN-61797');
		const malformedFileName = '%E0%A4%A.pdf';

		const result = formatter({
			formattedAnswer: fallback,
			answer: [{ fileName: malformedFileName, metadata: { documentGuid: 'document-guid' } }]
		});

		assert.equal(
			result,
			`<a href="/manage-local-plans/PLAN-61797/examination/download-document/document-guid">${malformedFileName}</a>`
		);
	});
});
