import { SubmissionCheckWithDate } from './submission-check-with-date.ts';
import { type SubmissionCheckData } from './submission-check.ts';
import { type ManageService } from '#service';
import { questions } from '../questions.ts';

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
		console.log('uploadedFiles67', uploadedFiles);
		const receivedDate = existingGatewayDetails?.reportIssuedDate;
		const fileUploadedDate = uploadedFiles.length > 0 ? uploadedFiles[0].dateCreated : undefined;
		const answersToReview = [
			...this.generateAdditionalDateField(fileUploadedDate, undefined),
			...this.formatDocuments(
				uploadedFiles,
				`/case/${caseReference}/download-case-document`,
				`/case/${caseReference}/${journeyId}/${section}/${questions.gateway2Report.url}`
			)
		];
		return {
			titleHeading: 'Check Gateway 2 report details and issue notification',
			answersToReview: answersToReview,
			caseReference: caseReference,
			journeyId: journeyId,
			section: section,
			question: questionUrl,
			backLink: this.generateBackUrl(originalUrl),
			notificationPreviewTemplate: questionUrl + (receivedDate ? '-complete' : ''),
			submitButtonText: 'Issue report',
			notificationTextLPA: "We'll send a notification to the LPA to tell them that the report is available"
		};
	}
}
