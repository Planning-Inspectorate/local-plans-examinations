import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createDownloadDocumentSummaryFormatter, decodeFileName } from './questions.ts';

describe('decodeFileName', () => {
	it('should decode URL-encoded file names', () => {
		const result = decodeFileName('my%20test%20document.pdf');
		assert.equal(result, 'my test document.pdf');
	});

	it('should return unencoded file names as-is', () => {
		const result = decodeFileName('simple-file.docx');
		assert.equal(result, 'simple-file.docx');
	});

	it('should return the original file name when decodeURIComponent throws an error', () => {
		// %E0%A4%A is an invalid UTF-8 sequence that causes decodeURIComponent to throw a URIError
		const invalidEncodedFileName = '%E0%A4%A.pdf';
		const result = decodeFileName(invalidEncodedFileName);
		assert.equal(result, invalidEncodedFileName);
	});
});

describe('createDownloadDocumentSummaryFormatter', () => {
	const planReference = 'PLAN-123';
	const formattedAnswerFallback = 'Default Answer Text';

	it('should return formattedAnswer if planReference is undefined', () => {
		const formatter = createDownloadDocumentSummaryFormatter(undefined);
		const result = formatter({
			formattedAnswer: formattedAnswerFallback,
			answer: [{ fileName: 'file.pdf', metadata: { documentGuid: 'guid-1' } }]
		});
		assert.equal(result, formattedAnswerFallback);
	});

	it('should return formattedAnswer if planReference is an empty string', () => {
		const formatter = createDownloadDocumentSummaryFormatter('');
		const result = formatter({
			formattedAnswer: formattedAnswerFallback,
			answer: [{ fileName: 'file.pdf', metadata: { documentGuid: 'guid-1' } }]
		});
		assert.equal(result, formattedAnswerFallback);
	});

	it('should return formattedAnswer if answer is empty or not an array', () => {
		const formatter = createDownloadDocumentSummaryFormatter(planReference);

		assert.equal(formatter({ formattedAnswer: formattedAnswerFallback, answer: [] }), formattedAnswerFallback);
		assert.equal(formatter({ formattedAnswer: formattedAnswerFallback, answer: null as any }), formattedAnswerFallback);
	});

	it('should return formattedAnswer if any file is missing documentGuid', () => {
		const formatter = createDownloadDocumentSummaryFormatter(planReference);
		const result = formatter({
			formattedAnswer: formattedAnswerFallback,
			answer: [
				{ fileName: 'valid.pdf', metadata: { documentGuid: 'guid-1' } },
				{ fileName: 'missing-guid.pdf', metadata: {} },
				{ fileName: 'no-metadata.pdf' }
			]
		});
		assert.equal(result, formattedAnswerFallback);
	});

	it('should format a single valid file as an anchor link', () => {
		const formatter = createDownloadDocumentSummaryFormatter(planReference);
		const result = formatter({
			formattedAnswer: formattedAnswerFallback,
			answer: [
				{
					fileName: 'my%20document.pdf',
					metadata: { documentGuid: 'doc-guid-123' }
				}
			]
		});

		const expectedLink = `<a href="/manage-local-plans/PLAN-123/gateway-2-submission/download-document/doc-guid-123">my document.pdf</a>`;
		assert.equal(result, expectedLink);
	});

	it('should use formattedAnswer as link text if fileName is missing or not a string', () => {
		const formatter = createDownloadDocumentSummaryFormatter(planReference);
		const result = formatter({
			formattedAnswer: formattedAnswerFallback,
			answer: [
				{
					metadata: { documentGuid: 'doc-guid-123' }
				}
			]
		});

		const expectedLink = `<a href="/manage-local-plans/PLAN-123/gateway-2-submission/download-document/doc-guid-123">${formattedAnswerFallback}</a>`;
		assert.equal(result, expectedLink);
	});

	it('should encode planReference and documentGuid in the URL', () => {
		const formatter = createDownloadDocumentSummaryFormatter('PLAN 123/45');
		const result = formatter({
			formattedAnswer: formattedAnswerFallback,
			answer: [
				{
					fileName: 'test.pdf',
					metadata: { documentGuid: 'guid with spaces' }
				}
			]
		});

		const expectedLink = `<a href="/manage-local-plans/PLAN%20123%2F45/gateway-2-submission/download-document/guid%20with%20spaces">test.pdf</a>`;
		assert.equal(result, expectedLink);
	});

	it('should format multiple files into an HTML bulleted list', () => {
		const formatter = createDownloadDocumentSummaryFormatter(planReference);
		const result = formatter({
			formattedAnswer: formattedAnswerFallback,
			answer: [
				{ fileName: 'file1.pdf', metadata: { documentGuid: 'guid-1' } },
				{ fileName: 'file2%20name.docx', metadata: { documentGuid: 'guid-2' } }
			]
		});

		const expectedList =
			`<ul class="govuk-list govuk-list--bullet">` +
			`<li><a href="/manage-local-plans/PLAN-123/gateway-2-submission/download-document/guid-1">file1.pdf</a></li>` +
			`<li><a href="/manage-local-plans/PLAN-123/gateway-2-submission/download-document/guid-2">file2 name.docx</a></li>` +
			`</ul>`;

		assert.equal(result, expectedList);
	});
});
