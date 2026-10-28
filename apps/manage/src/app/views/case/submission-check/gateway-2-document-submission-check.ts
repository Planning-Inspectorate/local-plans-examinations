import { SubmissionCheck, type SubmissionCheckData } from './submission-check.ts';
import { type ManageService } from '#service';

export class Gateway2DocumentSubmissionCheck extends SubmissionCheck {
	public async generateDataForPage(
		caseId: string,
		caseReference: string,
		journeyId: string,
		section: string,
		questionUrl: string,
		originalUrl: string,
		service: ManageService,
		uploadedFiles: any,
		questionTitle: any,

	): Promise<SubmissionCheckData> {
		if (questionTitle == 'Subsequent work towards a draft Plan') {
			questionTitle = 'Subsequent work towards draft plan';
		}

		const allDocuments = await service.db.document.findMany({
			where: {
				caseId,
				documentSet: {
					displayName: questionTitle.toLowerCase()
				},
				isDeleted: false
			},
			select: {
				guid: true,
				name: true
			}
		});

		const documents = allDocuments.map((document: any) => ({
			name: document.name.replace(/^.*\/[^/]+\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i, ''),
			url: `/case/${encodeURIComponent(caseReference)}/download-case-document/${encodeURIComponent(document.guid)}`
		}));

		return {
			titleHeading: 'Check document',
			caseReference,
			journeyId,
			section,
			question: questionUrl,
			backLink: `${this.generateBaseUrl(originalUrl)}/gateway-2/gateway-2/gateway2Documents`,
			submitButtonText: 'Upload document',
			notificationTextLPA: undefined,
			answersToReview: [
				{
					name: 'Section',
					value: questionTitle,
					url: undefined
				},
				{
					name: 'Documents',
					value: documents.length > 0 ? documents.map((document: any) => document.name).join(', ') : 'Not provided',
					url: questionUrl
				},
                ...this.formatDocuments(
					uploadedFiles,
					`/case/${caseReference}/download-case-document`,
					`/case/${caseReference}/${journeyId}/${section}/${questionUrl}`
				)
			]
		};
	}
}
