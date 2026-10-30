import { questions } from '../questions.ts';
import { SubmissionCheckWithDate } from './submission-check-with-date.ts';
import { type SubmissionCheckData } from './submission-check.ts';
import { type ManageService } from '#service';
import type { UploadedFile } from '@pins/local-plans-lib/storage/types.ts';

export class MiqsSubmissionCheck extends SubmissionCheckWithDate {
	public async generateDataForPage(
		caseId: string,
		caseReference: string,
		journeyId: string,
		section: string,
		questionUrl: string,
		originalUrl: string,
		_service: ManageService,
		uploadedFiles: UploadedFile[]
	): Promise<SubmissionCheckData> {
		return {
			titleHeading: 'Check MIQ documents and send notification',
			answersToReview: [
				...this.formatDocuments(
					uploadedFiles,
					`/case/${caseReference}/download-case-document`,
					`/case/${caseReference}/${journeyId}/${section}/${questions.miqs.url}`,
					'returnTo=check'
				)
			],
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
