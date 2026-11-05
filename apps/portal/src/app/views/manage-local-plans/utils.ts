import { VIRUS_CHECK_STATUS_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';
import { virusScanStatusTag } from '@pins/local-plans-lib/forms/custom-components/file-uploader/virus-scan.ts';

/**
 * Builds a summary value formatter that renders uploaded documents as download links,
 * annotated with their virus scan status. Files that have a virus detected are not
 * rendered as links; instead a GOV.UK error message is shown.
 *
 * planReference - the local plan reference used to build download URLs
 * gatewaySubmissionPath - the gateway submission URL segment (e.g. 'gateway-2-submission')
 */
export function createDownloadDocumentSummaryFormatter(
	planReference: string | undefined,
	gatewaySubmissionPath: string
) {
	const encodedPlanReference = planReference ? encodeURIComponent(planReference) : undefined;
	return ({
		formattedAnswer,
		answer
	}: {
		formattedAnswer: string;
		answer: {
			fileName?: string;
			virusCheckStatus?: string;
			metadata?: {
				documentGuid?: string;
			};
		}[];
	}) => {
		if (!encodedPlanReference || !Array.isArray(answer) || answer.length === 0) {
			return formattedAnswer;
		}

		const linkedFiles = answer.map((file) => {
			const documentGuid = file.metadata?.documentGuid;

			if (typeof documentGuid !== 'string' || !documentGuid) {
				return undefined;
			}

			const fileName = typeof file.fileName === 'string' ? decodeFileName(file.fileName) : formattedAnswer;
			const statusTag = virusScanStatusTag(file.virusCheckStatus);

			// When a virus has been detected, users are unable to download it - no download link
			if (file.virusCheckStatus === VIRUS_CHECK_STATUS_ID.AFFECTED) {
				return `<div class="govuk-form-group govuk-form-group--error">
<p class="govuk-error-message">
<span class="govuk-visually-hidden">Error:</span>${fileName} contains a virus. Remove the file and upload a different version.
</p>${fileName} ${statusTag}
</div>`;
			}

			return `<a href="/manage-local-plans/${encodedPlanReference}/${gatewaySubmissionPath}/download-document/${encodeURIComponent(
				documentGuid
			)}">${fileName}</a> ${statusTag}`;
		});

		if (linkedFiles.some((file) => file === undefined)) {
			return formattedAnswer;
		}

		if (linkedFiles.length === 1) {
			return linkedFiles[0];
		}

		return `<ul class="govuk-list govuk-list--bullet">${linkedFiles.map((file) => `<li>${file}</li>`).join('')}</ul>`;
	};
}

export function decodeFileName(fileName: string) {
	try {
		return decodeURIComponent(fileName);
	} catch {
		return fileName;
	}
}
