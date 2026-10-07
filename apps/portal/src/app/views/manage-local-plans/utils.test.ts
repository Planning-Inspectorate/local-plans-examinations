import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { virusScanStatusTag } from './utils.ts';
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
