import { SubmissionCheck } from './submission-check.ts';
import { type SubmissionCheckData } from './submission-check.ts';
import { type ManageService } from '#service';

export class Gateway2DocumentSubmissionCheck extends SubmissionCheck {
	public async generateDataForPage(
		_caseId: string,
		caseReference: string,
		journeyId: string,
		section: string,
		questionUrl: string,
		originalUrl: string,
		_service: ManageService,
		uploadedFiles: any[],
		questionTitle?: string
	): Promise<SubmissionCheckData> {
		if (!questionTitle) {
			throw new Error(`Could not find a title for Gateway 2 document '${questionUrl}'`);
		}

		return {
			titleHeading: 'Check document',
			uploadedFiles,
			caseReference,
			journeyId,
			section,
			question: questionUrl,
			backLink: this.generateBackUrl(originalUrl),
			notificationPreviewTemplate: '',
			submitButtonText: 'Upload document',
			additionalFields: [
				{
					name: 'Section',
					value: questionTitle,
					url: undefined
				},
				{
					name: 'Documents',
					value: null,
					url: undefined
				}
			]
		};
	}
}
