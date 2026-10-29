import { SubmissionCheckWithDate } from './submission-check-with-date.ts';
import { type SubmissionCheckData } from './submission-check.ts';
import { type ManageService } from '#service';
import type { UploadedFile } from '@pins/local-plans-lib/storage/types.ts';
import { questions } from '../questions.ts';

export class MiqDocumentsSubmissionCheck extends SubmissionCheckWithDate {
	public async generateDataForPage(
		_caseId: string,
		caseReference: string,
		journeyId: string,
		section: string,
		questionUrl: string,
		originalUrl: string,
		_service: ManageService,
		uploadedFiles: UploadedFile[]
	): Promise<SubmissionCheckData> {
		const fileUploadedDate = uploadedFiles.length > 0 ? uploadedFiles[0].dateCreated : undefined;
		const answersToReview = [
			...this.generateAdditionalDateField(fileUploadedDate, undefined),
			...this.formatDocuments(
				uploadedFiles,
				`/case/${caseReference}/download-case-document`,
				`/case/${caseReference}/${journeyId}/${section}/${questions.examinationMiqDocuments.url}`
			)
		];
		return {
			titleHeading: 'Check MIQ documents and send notification',
			answersToReview: answersToReview,
			caseReference: caseReference,
			journeyId: journeyId,
			section: section,
			question: questionUrl,
			backLink: this.generateBackUrl(originalUrl),
			submitButtonText: 'Confirm and notify',
			notificationTextLPA:
				"We'll send a notification to the planning authority to tell them that the MIQ documents are available."
		};
	}
}
