import { SubmissionCheckWithDate } from './submission-check-with-date.ts';
import { type SubmissionCheckData } from './submission-check.ts';

export class SignedSLASubmissionCheck extends SubmissionCheckWithDate {
	public async generateDataForPage(): Promise<SubmissionCheckData> {
		const existingGatewayDetails = await this.service.db.gateway1Info.findUnique({
			select: {
				slaSentDate: true,
				slaReceivedDate: true
			},
			where: {
				caseId: this.caseId
			}
		});
		const complete = existingGatewayDetails?.slaSentDate;
		return {
			titleHeading: 'Check signed SLA and issue notification',
			uploadedFiles: this.uploadedFiles,
			caseReference: this.caseReference,
			journeyId: this.journeyId,
			section: this.section,
			question: this.questionUrl,
			backLink: this.generateBackUrl(this.originalUrl),
			notificationPreviewTemplate: this.questionUrl + (complete ? '-complete' : ''),
			submitButtonText: 'Confirm and issue notification',
			additionalFields: this.generateAdditionalDateField(existingGatewayDetails?.slaReceivedDate, 'slaReceivedDate')
		};
	}
}
