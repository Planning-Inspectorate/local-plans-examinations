import { setVirusScanViewLocals, virusScanStatusTag } from './virus-scan.ts';
import { VIRUS_CHECK_STATUS_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

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

describe('setVirusScanViewLocals', () => {
	function buildRes(answers: Record<string, unknown>) {
		return {
			locals: {
				journeyResponse: { answers }
			}
		} as never as Parameters<typeof setVirusScanViewLocals>[0];
	}

	it('aggregates uploaded files across the given field names', () => {
		const res = buildRes({
			gateway2CoverLetter: [{ id: 'file-1', fileName: 'letter.pdf', virusCheckStatus: 'scanned' }],
			gateway1SelfAssessment: [{ id: 'file-2', fileName: 'assessment.pdf', virusCheckStatus: 'not_scanned' }],
			ignoredField: [{ id: 'file-3', fileName: 'other.pdf', virusCheckStatus: 'affected' }]
		});

		setVirusScanViewLocals(res, ['gateway2CoverLetter', 'gateway1SelfAssessment']);

		assert.equal(res.locals.virusScanInProgress, true);
		assert.equal(res.locals.virusErrorSummary, undefined);
	});

	it('surfaces a virus detected error summary entry for each affected file', () => {
		const res = buildRes({
			docsA: [{ id: 'file-1', fileName: 'bad.pdf', virusCheckStatus: 'affected' }],
			docsB: [{ id: 'file-2', fileName: 'good.pdf', virusCheckStatus: 'scanned' }]
		});

		setVirusScanViewLocals(res, ['docsA', 'docsB']);

		assert.equal(res.locals.virusScanInProgress, false);
		assert.deepEqual(res.locals.virusErrorSummary, [
			{
				text: 'bad.pdf contains a virus. Remove the file and upload a different version.',
				href: '#uploaded-file-file-1'
			}
		]);
	});

	it('reports no virus activity when there is no journey response', () => {
		const res = { locals: {} } as never as Parameters<typeof setVirusScanViewLocals>[0];

		setVirusScanViewLocals(res, ['docsA']);

		assert.equal(res.locals.virusScanInProgress, false);
		assert.equal(res.locals.virusErrorSummary, undefined);
	});

	it('clears both scan indicators when mixed uploads finish cleanly', () => {
		const res = buildRes({
			documents: [
				{ id: 'pending', fileName: 'pending.pdf', virusCheckStatus: 'not_scanned' },
				{ id: 'infected', fileName: 'infected.pdf', virusCheckStatus: 'affected' }
			],
			missingFiles: null,
			otherAnswer: 'not a file list'
		});

		setVirusScanViewLocals(res, ['documents', 'missingFiles', 'otherAnswer']);
		assert.equal(res.locals.virusScanInProgress, true);
		assert.deepEqual(res.locals.virusErrorSummary, [
			{
				text: 'infected.pdf contains a virus. Remove the file and upload a different version.',
				href: '#uploaded-file-infected'
			}
		]);

		res.locals.journeyResponse.answers.documents = [
			{ id: 'pending', fileName: 'pending.pdf', virusCheckStatus: 'scanned' },
			{ id: 'infected', fileName: 'infected.pdf', virusCheckStatus: 'scanned' }
		];
		setVirusScanViewLocals(res, ['documents']);
		assert.equal(res.locals.virusScanInProgress, false);
		assert.equal(res.locals.virusErrorSummary, undefined);
	});
});
