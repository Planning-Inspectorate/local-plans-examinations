import { SubmissionCheckWithDate } from './submission-check-with-date.ts';
import { type SubmissionCheckData } from './submission-check.ts';

export class Gateway2ReportSubmissionCheck extends SubmissionCheckWithDate {
	public async generateDataForPage(): Promise<SubmissionCheckData> {
		const existingGatewayDetails = await this.service.db.gateway2Info.findUnique({
			select: {
				reportIssuedDate: true
			},
			where: {
				caseId: this.caseId
			}
		});
		const receivedDate = existingGatewayDetails?.reportIssuedDate;
		return {
			titleHeading: 'Check Gateway 2 report details and issue notification',
			uploadedFiles: this.uploadedFiles,
			caseReference: this.caseReference,
			journeyId: this.journeyId,
			section: this.section,
			question: this.questionUrl,
			backLink: this.generateBackUrl(this.originalUrl),
			notificationPreviewTemplate: this.questionUrl + (receivedDate ? '-complete' : ''),
			submitButtonText: 'Issue report',
			additionalFields: []
		};
	}
}
