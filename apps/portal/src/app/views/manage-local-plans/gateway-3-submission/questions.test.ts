import { describe, it } from 'node:test';
import { createDownloadDocumentSummaryFormatter } from '../gateway-2-submission/questions.ts';
import { VIRUS_CHECK_STATUS_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';
import assert from 'node:assert/strict';

describe('createDownloadDocumentSummaryFormatter', () => {
	const planReference = 'PLAN-123';
	const formattedAnswerFallback = 'Default Answer Text';

	it('should append a "Virus scanning" tag to the link for NOT_SCANNED files', () => {
		const formatter = createDownloadDocumentSummaryFormatter(planReference);
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
		const formatter = createDownloadDocumentSummaryFormatter(planReference);
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

		assert.equal(result, 'infected.pdf <strong class="govuk-tag govuk-tag--red">Virus detected</strong>');
		assert.ok(!(result as string).includes('<a href'));
	});

	it('should decode the file name for AFFECTED files', () => {
		const formatter = createDownloadDocumentSummaryFormatter(planReference);
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

		assert.equal(result, 'bad file.pdf <strong class="govuk-tag govuk-tag--red">Virus detected</strong>');
	});

	it('should not append a tag for SCANNED (clean) files', () => {
		const formatter = createDownloadDocumentSummaryFormatter(planReference);
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
		const formatter = createDownloadDocumentSummaryFormatter(planReference);
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
			`<li>infected.pdf <strong class="govuk-tag govuk-tag--red">Virus detected</strong></li>` +
			`</ul>`;

		assert.equal(result, expectedList);
	});
});
