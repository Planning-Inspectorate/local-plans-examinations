import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { virusScanStatusTag, createDownloadDocumentSummaryFormatter, decodeFileName } from './utils.ts';
import { VIRUS_CHECK_STATUS_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';

describe('virusScanStatusTag', () => {
	it('should return a yellow "Virus scanning" tag for NOT_SCANNED', () => {
		const result = virusScanStatusTag(VIRUS_CHECK_STATUS_ID.NOT_SCANNED);
		assert.equal(result, '<strong class="govuk-tag govuk-tag--yellow">Virus scanning</strong>');
	});

	it('should return a red "Virus detected" tag for AFFECTED', () => {
		const result = virusScanStatusTag(VIRUS_CHECK_STATUS_ID.AFFECTED);
		assert.equal(result, '<strong class="govuk-tag govuk-tag--red">Virus detected</strong>');
	});

	it('should return an empty string for SCANNED (clean) files', () => {
		assert.equal(virusScanStatusTag(VIRUS_CHECK_STATUS_ID.SCANNED), '');
	});

	it('should return an empty string when the status is undefined', () => {
		assert.equal(virusScanStatusTag(undefined), '');
	});

	it('should return an empty string for an unknown status', () => {
		assert.equal(virusScanStatusTag('some-other-status'), '');
	});
});

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
	const gatewaySubmissionPath = 'gateway-2-submission';
	const formattedAnswerFallback = 'Default Answer Text';

	it('should return formattedAnswer if planReference is undefined', () => {
		const formatter = createDownloadDocumentSummaryFormatter(undefined, gatewaySubmissionPath);
		const result = formatter({
			formattedAnswer: formattedAnswerFallback,
			answer: [{ fileName: 'file.pdf', metadata: { documentGuid: 'guid-1' } }]
		});
		assert.equal(result, formattedAnswerFallback);
	});

	it('should return formattedAnswer if planReference is an empty string', () => {
		const formatter = createDownloadDocumentSummaryFormatter('', gatewaySubmissionPath);
		const result = formatter({
			formattedAnswer: formattedAnswerFallback,
			answer: [{ fileName: 'file.pdf', metadata: { documentGuid: 'guid-1' } }]
		});
		assert.equal(result, formattedAnswerFallback);
	});

	it('should return formattedAnswer if answer is empty or not an array', () => {
		const formatter = createDownloadDocumentSummaryFormatter(planReference, gatewaySubmissionPath);

		assert.equal(formatter({ formattedAnswer: formattedAnswerFallback, answer: [] }), formattedAnswerFallback);
		assert.equal(formatter({ formattedAnswer: formattedAnswerFallback, answer: null as any }), formattedAnswerFallback);
	});

	it('should return formattedAnswer if any file is missing documentGuid', () => {
		const formatter = createDownloadDocumentSummaryFormatter(planReference, gatewaySubmissionPath);
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
		const formatter = createDownloadDocumentSummaryFormatter(planReference, gatewaySubmissionPath);
		const result = formatter({
			formattedAnswer: formattedAnswerFallback,
			answer: [
				{
					fileName: 'my%20document.pdf',
					metadata: { documentGuid: 'doc-guid-123' }
				}
			]
		});

		const expectedLink = `<a href="/manage-local-plans/PLAN-123/gateway-2-submission/download-document/doc-guid-123">my document.pdf</a> `;
		assert.equal(result, expectedLink);
	});

	it('should use formattedAnswer as link text if fileName is missing or not a string', () => {
		const formatter = createDownloadDocumentSummaryFormatter(planReference, gatewaySubmissionPath);
		const result = formatter({
			formattedAnswer: formattedAnswerFallback,
			answer: [
				{
					metadata: { documentGuid: 'doc-guid-123' }
				}
			]
		});

		const expectedLink = `<a href="/manage-local-plans/PLAN-123/gateway-2-submission/download-document/doc-guid-123">${formattedAnswerFallback}</a> `;
		assert.equal(result, expectedLink);
	});

	it('should encode planReference and documentGuid in the URL', () => {
		const formatter = createDownloadDocumentSummaryFormatter('PLAN 123/45', gatewaySubmissionPath);
		const result = formatter({
			formattedAnswer: formattedAnswerFallback,
			answer: [
				{
					fileName: 'test.pdf',
					metadata: { documentGuid: 'guid with spaces' }
				}
			]
		});

		const expectedLink = `<a href="/manage-local-plans/PLAN%20123%2F45/gateway-2-submission/download-document/guid%20with%20spaces">test.pdf</a> `;
		assert.equal(result, expectedLink);
	});

	it('should use the provided gateway submission path in the URL', () => {
		const formatter = createDownloadDocumentSummaryFormatter(planReference, 'gateway-3-submission');
		const result = formatter({
			formattedAnswer: formattedAnswerFallback,
			answer: [
				{
					fileName: 'test.pdf',
					metadata: { documentGuid: 'guid-1' }
				}
			]
		});

		const expectedLink = `<a href="/manage-local-plans/PLAN-123/gateway-3-submission/download-document/guid-1">test.pdf</a> `;
		assert.equal(result, expectedLink);
	});

	it('should format multiple files into an HTML bulleted list', () => {
		const formatter = createDownloadDocumentSummaryFormatter(planReference, gatewaySubmissionPath);
		const result = formatter({
			formattedAnswer: formattedAnswerFallback,
			answer: [
				{ fileName: 'file1.pdf', metadata: { documentGuid: 'guid-1' } },
				{ fileName: 'file2%20name.docx', metadata: { documentGuid: 'guid-2' } }
			]
		});

		const expectedList =
			`<ul class="govuk-list govuk-list--bullet">` +
			`<li><a href="/manage-local-plans/PLAN-123/gateway-2-submission/download-document/guid-1">file1.pdf</a> </li>` +
			`<li><a href="/manage-local-plans/PLAN-123/gateway-2-submission/download-document/guid-2">file2 name.docx</a> </li>` +
			`</ul>`;

		assert.equal(result, expectedList);
	});

	it('should append a "Virus scanning" tag to the link for NOT_SCANNED files', () => {
		const formatter = createDownloadDocumentSummaryFormatter(planReference, gatewaySubmissionPath);
		const result = formatter({
			formattedAnswer: formattedAnswerFallback,
			answer: [
				{
					fileName: 'scanning.pdf',
					virusCheckStatus: VIRUS_CHECK_STATUS_ID.NOT_SCANNED,
					metadata: { documentGuid: 'guid-1' }
				}
			]
		});

		const expectedLink =
			`<a href="/manage-local-plans/PLAN-123/gateway-2-submission/download-document/guid-1">scanning.pdf</a> ` +
			`<strong class="govuk-tag govuk-tag--yellow">Virus scanning</strong>`;
		assert.equal(result, expectedLink);
	});

	it('should NOT render a download link for AFFECTED files, only the file name and tag', () => {
		const formatter = createDownloadDocumentSummaryFormatter(planReference, gatewaySubmissionPath);
		const result = formatter({
			formattedAnswer: formattedAnswerFallback,
			answer: [
				{
					fileName: 'infected.pdf',
					virusCheckStatus: VIRUS_CHECK_STATUS_ID.AFFECTED,
					metadata: { documentGuid: 'guid-1' }
				}
			]
		});

		assert.equal(
			result,
			`<div class="govuk-form-group govuk-form-group--error">\n` +
				`<p class="govuk-error-message">\n` +
				`<span class="govuk-visually-hidden">Error:</span>infected.pdf contains a virus. Remove the file and upload a different version.\n` +
				`</p>infected.pdf <strong class="govuk-tag govuk-tag--red">Virus detected</strong>\n` +
				`</div>`
		);
		assert.ok(!(result as string).includes('<a href'));
	});

	it('should decode the file name for AFFECTED files', () => {
		const formatter = createDownloadDocumentSummaryFormatter(planReference, gatewaySubmissionPath);
		const result = formatter({
			formattedAnswer: formattedAnswerFallback,
			answer: [
				{
					fileName: 'bad%20file.pdf',
					virusCheckStatus: VIRUS_CHECK_STATUS_ID.AFFECTED,
					metadata: { documentGuid: 'guid-1' }
				}
			]
		});

		assert.equal(
			result,
			`<div class="govuk-form-group govuk-form-group--error">\n` +
				`<p class="govuk-error-message">\n` +
				`<span class="govuk-visually-hidden">Error:</span>bad file.pdf contains a virus. Remove the file and upload a different version.\n` +
				`</p>bad file.pdf <strong class="govuk-tag govuk-tag--red">Virus detected</strong>\n` +
				`</div>`
		);
	});

	it('should not append a tag for SCANNED (clean) files', () => {
		const formatter = createDownloadDocumentSummaryFormatter(planReference, gatewaySubmissionPath);
		const result = formatter({
			formattedAnswer: formattedAnswerFallback,
			answer: [
				{
					fileName: 'clean.pdf',
					virusCheckStatus: VIRUS_CHECK_STATUS_ID.SCANNED,
					metadata: { documentGuid: 'guid-1' }
				}
			]
		});

		assert.equal(
			result,
			'<a href="/manage-local-plans/PLAN-123/gateway-2-submission/download-document/guid-1">clean.pdf</a> '
		);
	});

	it('should render a mixed bulleted list with links, tags and non-downloadable affected files', () => {
		const formatter = createDownloadDocumentSummaryFormatter(planReference, gatewaySubmissionPath);
		const result = formatter({
			formattedAnswer: formattedAnswerFallback,
			answer: [
				{
					fileName: 'clean.pdf',
					virusCheckStatus: VIRUS_CHECK_STATUS_ID.SCANNED,
					metadata: { documentGuid: 'guid-1' }
				},
				{
					fileName: 'scanning.pdf',
					virusCheckStatus: VIRUS_CHECK_STATUS_ID.NOT_SCANNED,
					metadata: { documentGuid: 'guid-2' }
				},
				{
					fileName: 'infected.pdf',
					virusCheckStatus: VIRUS_CHECK_STATUS_ID.AFFECTED,
					metadata: { documentGuid: 'guid-3' }
				}
			]
		});

		const expectedList =
			`<ul class="govuk-list govuk-list--bullet">` +
			`<li><a href="/manage-local-plans/PLAN-123/gateway-2-submission/download-document/guid-1">clean.pdf</a> </li>` +
			`<li><a href="/manage-local-plans/PLAN-123/gateway-2-submission/download-document/guid-2">scanning.pdf</a> <strong class="govuk-tag govuk-tag--yellow">Virus scanning</strong></li>` +
			`<li><div class="govuk-form-group govuk-form-group--error">\n` +
			`<p class="govuk-error-message">\n` +
			`<span class="govuk-visually-hidden">Error:</span>infected.pdf contains a virus. Remove the file and upload a different version.\n` +
			`</p>infected.pdf <strong class="govuk-tag govuk-tag--red">Virus detected</strong>\n` +
			`</div></li>` +
			`</ul>`;

		assert.equal(result, expectedList);
	});
});
