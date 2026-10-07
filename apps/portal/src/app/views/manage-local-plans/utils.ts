import { VIRUS_CHECK_STATUS_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';

/**
 * Builds the GOV.UK status tag markup for a file's virus scan state.
 * Returns an empty string for scanned/clean files (no tag required).
 */
export function virusScanStatusTag(virusCheckStatus: string | undefined): string {
	switch (virusCheckStatus) {
		case VIRUS_CHECK_STATUS_ID.NOT_SCANNED:
			return '<strong class="govuk-tag govuk-tag--yellow">Virus scanning</strong>';
		case VIRUS_CHECK_STATUS_ID.AFFECTED:
			return '<strong class="govuk-tag govuk-tag--red">Virus detected</strong>';
		default:
			return '';
	}
}
