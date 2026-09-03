import { SubmissionCheckWithDate } from './submission-check-with-date.ts';
import { type SubmissionCheckData } from './submission-check.ts';
import { type ManageService } from '#service';

export class Gateway2ReportSubmissionCheck extends SubmissionCheckWithDate {
	public async generateDataForPage(
		caseId: string,
		caseReference: string,
		journeyId: string,
		section: string,
		questionUrl: string,
		originalUrl: string,
		service: ManageService,
		uploadedFiles: any
	): Promise<SubmissionCheckData> {
		const existingGatewayDetails = await service.db.gateway2Info.findUnique({
			select: {
				reportIssuedDate: true
			},
			where: {
				caseId: caseId
			}
		});
		const receivedDate = existingGatewayDetails?.reportIssuedDate;
		const fileUploadedDate = uploadedFiles.length > 0 ? uploadedFiles[0].dateCreated : undefined;
		return {
			titleHeading: 'Check Gateway 2 report details and issue notification',
			uploadedFiles: uploadedFiles,
			caseReference: caseReference,
			journeyId: journeyId,
			section: section,
			question: questionUrl,
			backLink: this.generateBackUrl(originalUrl),
			notificationPreviewTemplate: questionUrl + (receivedDate ? '-complete' : ''),
			submitButtonText: 'Issue report',
			additionalFields: this.generateAdditionalDateField(fileUploadedDate, undefined)
		};
	}
}
