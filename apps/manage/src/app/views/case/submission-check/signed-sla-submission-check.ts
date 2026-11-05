import { SubmissionCheckWithDate } from './submission-check-with-date.ts';
import { type SubmissionCheckData } from './submission-check.ts';
import { type ManageService } from '#service';
import { questions } from '../questions.ts';

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
		const answersToReview = [
			...this.generateAdditionalDateField(
				existingGatewayDetails?.slaReceivedDate,
				`/case/${caseReference}/${journeyId}/${section}/sla-received-date`
			),
			...this.formatDocuments(
				uploadedFiles,
				`/case/${caseReference}/download-case-document`,
				`/case/${caseReference}/${journeyId}/${section}/${questions.signedSla.url}`
			)
		];
		return {
			titleHeading: 'Check signed SLA and issue notification',
			answersToReview: answersToReview,
			caseReference: caseReference,
			journeyId: journeyId,
			section: section,
			question: questionUrl,
			backLink: this.generateBackUrl(originalUrl),
			notificationPreviewTemplate: questionUrl + (complete ? '-complete' : ''),
			submitButtonText: 'Confirm and issue notification',
			notificationTextLPA: undefined
		};
	}
}
