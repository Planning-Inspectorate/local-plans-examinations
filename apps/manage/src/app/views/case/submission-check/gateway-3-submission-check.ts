import { SubmissionCheck, type SubmissionCheckData } from './submission-check.ts';

export class Gateway3SubmissionCheck extends SubmissionCheck {
	public async generateDataForPage(): Promise<SubmissionCheckData> {
		const existingGatewayDetails = await this.service.db.gateway3Info.findUnique({
			select: {
				completionDate: true,
				decision: true
			},
			where: {
				caseId: this.caseId
			}
		});
		const complete = existingGatewayDetails?.completionDate;
		const decisionMap: Record<string, string> = {
			'1': 'Proceed to examination',
			'2': 'Resubmission required'
		};
		if (!existingGatewayDetails?.decision) {
			throw Error('');
		}
		const decisionText = existingGatewayDetails?.decision ? decisionMap[existingGatewayDetails?.decision] : '';
		return {
			titleHeading: 'Check gateway 3 decision and report details',
			uploadedFiles: this.uploadedFiles,
			caseReference: this.caseReference,
			journeyId: this.journeyId,
			section: this.section,
			question: this.questionUrl,
			backLink: this.generateBackUrl(this.originalUrl),
			notificationPreviewTemplate: this.questionUrl + (complete ? '-complete' : ''),
			submitButtonText: 'Issue decision',
			additionalFields: [
				{
					name: 'Outcome',
					value: decisionText,
					url: 'gateway-3-decision'
				}
			]
		};
	}
}
