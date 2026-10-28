import { SubmissionCheckWithDate } from './submission-check-with-date.ts';
import { type SubmissionCheckData } from './submission-check.ts';
import { type ManageService } from '#service';

export class MiqDocumentsSubmissionCheck extends SubmissionCheckWithDate {
	public async generateDataForPage(
		_caseId: string,
		caseReference: string,
		journeyId: string,
		section: string,
		questionUrl: string,
		originalUrl: string,
		_service: ManageService,
		uploadedFiles: any
	): Promise<SubmissionCheckData> {
		const fileUploadedDate = uploadedFiles.length > 0 ? uploadedFiles[0].dateCreated : undefined;
		return {
			titleHeading: 'Check MIQ documents and send notification',
			uploadedFiles: uploadedFiles,
			caseReference: caseReference,
			journeyId: journeyId,
			section: section,
			question: questionUrl,
			backLink: this.generateBackUrl(originalUrl),
			submitButtonText: 'Confirm and notify',
			additionalFields: this.generateAdditionalDateField(fileUploadedDate, undefined),
			notificationTextLPA:
				"We'll send a notification to the planning authority to tell them that the MIQ documents are available."
		};
	}
}
