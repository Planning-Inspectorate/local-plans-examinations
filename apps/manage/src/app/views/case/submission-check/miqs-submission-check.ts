import { SubmissionCheckWithDate } from './submission-check-with-date.ts';
import { type SubmissionCheckData } from './submission-check.ts';

export class MiqsSubmissionCheck extends SubmissionCheckWithDate {
	public async generateDataForPage(
		caseId: string,
		caseReference: string,
		journeyId: string,
		section: string,
		questionUrl: string,
		originalUrl: string,
		_service: unknown,
		uploadedFiles: any
	): Promise<SubmissionCheckData> {
		return {
			titleHeading: 'Check MIQ documents and send notification',
			uploadedFiles: uploadedFiles,
			caseReference: caseReference,
			journeyId: journeyId,
			section: section,
			question: questionUrl,
			backLink: this.generateBackUrl(originalUrl),
			notificationPreviewTemplate: questionUrl,
			submitButtonText: 'Confirm and notify',
			additionalFields: [],
			hideNotificationPreview: true,
			notificationTextLPA:
				"We'll send a notification to the planning authority to tell them that the MIQ documents are available."
		};
	}
}
