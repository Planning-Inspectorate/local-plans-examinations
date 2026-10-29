import { SubmissionCheckWithDate } from './submission-check-with-date.ts';
import { type SubmissionCheckData } from './submission-check.ts';
import { type ManageService } from '#service';
import { questions } from '../questions.ts';
import type { UploadedFile } from '@pins/local-plans-lib/storage/types.ts';

export class Gateway2WorkshopDocumentsSubmissionCheck extends SubmissionCheckWithDate {
	public async generateDataForPage(
		caseId: string,
		caseReference: string,
		journeyId: string,
		section: string,
		questionUrl: string,
		originalUrl: string,
		service: ManageService,
		uploadedFiles: UploadedFile[]
	): Promise<SubmissionCheckData> {
		const existingGatewayDetails = await service.db.gateway2Info.findUnique({
			select: {
				workshopDocumentUploadedDate: true
			},
			where: {
				caseId: caseId
			}
		});
		const receivedDate = existingGatewayDetails?.workshopDocumentUploadedDate;
		const fileUploadedDate = uploadedFiles.length > 0 ? uploadedFiles[0].dateCreated : undefined;
		const answersToReview = [
			...this.generateAdditionalDateField(fileUploadedDate, undefined),
			...this.formatDocuments(
				uploadedFiles,
				`/case/${caseReference}/download-case-document`,
				`/case/${caseReference}/${journeyId}/${section}/${questions.gateway2WorkshopDocuments.url}`
			)
		];
		return {
			titleHeading: 'Check workshop documents and issue notification',
			answersToReview: answersToReview,
			caseReference: caseReference,
			journeyId: journeyId,
			section: section,
			question: questionUrl,
			backLink: this.generateBackUrl(originalUrl),
			notificationPreviewTemplate: questionUrl + (receivedDate ? '-complete' : ''),
			submitButtonText: 'Issue documents',
			notificationTextLPA:
				"We'll send a notification to the LPA to tell them that the workshop documents are available."
		};
	}
}
