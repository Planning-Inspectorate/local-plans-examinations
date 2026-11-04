import type { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import type { UploadedFile } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import { buildVirusScanViewData } from '@pins/local-plans-lib/forms/custom-components/file-uploader/question.ts';
import { VIRUS_CHECK_STATUS_ID } from '@pins/local-plans-database/src/seed/static-data/ids/document-version.ts';

export interface VirusScanViewLocals {
	journeyResponse?: JourneyResponse;
	virusScanInProgress?: boolean;
	virusErrorSummary?: ReturnType<typeof buildVirusScanViewData>['errorSummary'];
}

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

/*
sets the flags that cause "scan in progress" banner and any "virus detected" messages at the top of the CYA pages. callers just pass the field names of their file upload questions.
*/
export function setVirusScanViewLocals(res: { locals: VirusScanViewLocals }, fieldNames: string[]) {
	const journeyResponse = res.locals.journeyResponse;
	const answers = journeyResponse?.answers ?? {};
	const uploadedFiles = fieldNames.flatMap((fieldName) => {
		const answer = answers[fieldName];
		return Array.isArray(answer) ? (answer as UploadedFile[]) : [];
	});

	const { virusScanInProgress, errorSummary } = buildVirusScanViewData(uploadedFiles);
	res.locals.virusScanInProgress = virusScanInProgress;
	res.locals.virusErrorSummary = errorSummary;
}
