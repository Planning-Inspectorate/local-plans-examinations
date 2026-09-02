import { SubmissionCheckWithDate } from './submission-check-with-date.ts';
import { type SubmissionCheckData } from './submission-check.ts';
import { type ManageService } from '#service';

export class SignedSLASubmissionCheck extends SubmissionCheckWithDate {
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
		const existingGatewayDetails = await service.db.gateway1Info.findUnique({
			select: {
				slaSentDate: true,
				slaReceivedDate: true
			},
			where: {
				caseId: caseId
			}
		});
		const complete = existingGatewayDetails?.slaSentDate;
		return {
			titleHeading: 'Check signed SLA and issue notification',
			uploadedFiles: uploadedFiles,
			caseReference: caseReference,
			journeyId: journeyId,
			section: section,
			question: questionUrl,
			backLink: this.generateBackUrl(originalUrl),
			notificationPreviewTemplate: questionUrl + (complete ? '-complete' : ''),
			submitButtonText: 'Confirm and issue notification',
			additionalFields: this.generateAdditionalDateField(existingGatewayDetails?.slaReceivedDate, 'slaReceivedDate')
		};
	}
}
