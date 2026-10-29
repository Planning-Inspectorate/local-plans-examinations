import { SubmissionCheck, type SubmissionCheckData } from './submission-check.ts';
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
		uploadedFiles: any,
		questionTitle?: string
	): Promise<SubmissionCheckData> {
		if (!questionTitle) {
			throw new Error(`Could not find a title for Gateway 2 document '${questionUrl}'`);
		}

		if (questionTitle == 'Subsequent work towards a draft Plan') {
			questionTitle = 'Subsequent work towards draft plan';
		}
		console.log('questionTitle5', questionTitle);

		const allDocuments = await _service.db.document.findMany({
			where: {
				caseId: _caseId,
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
					value: documents.length > 0 ? documents : 'Not provided',
					url: `/case/${encodeURIComponent(caseReference)}/${encodeURIComponent(journeyId)}/${encodeURIComponent(section)}/${encodeURIComponent(questionUrl)}`
				}
			]
		};
	}
}
