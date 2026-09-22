import { SubmissionCheck, type SubmissionCheckData } from './submission-check.ts';
import { type ManageService } from '#service';
import { GATEWAY_3_DECISION_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';

export class Gateway3SubmissionCheck extends SubmissionCheck {
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
		const existingGatewayDetails = await service.db.gateway3Info.findUnique({
			select: {
				completionDate: true,
				decision: true
			},
			where: {
				caseId: caseId
			}
		});
		const complete = existingGatewayDetails?.completionDate;
		const decisionMap: Record<string, string> = {
			[GATEWAY_3_DECISION_ID.PROCEED_TO_EXAMINATION]: 'Proceed to examination',
			[GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED]: 'Resubmission required'
		};
		if (!existingGatewayDetails?.decision) {
			throw Error(
				`A decision must be defined in the data for the case '${caseId}' when entering Gateway3SubmissionCheck`
			);
		}
		const decisionText = decisionMap[existingGatewayDetails?.decision] ?? null;
		if (!decisionText) {
			throw Error(
				`Undefined decision number found for gateway3Info.decision value '${existingGatewayDetails?.decision}' in Gateway3SubmissionCheck`
			);
		}
		const baseBackLink = this.generateBackUrl(originalUrl);
		return {
			titleHeading: 'Check gateway 3 decision and report details',
			uploadedFiles: uploadedFiles,
			caseReference: caseReference,
			journeyId: journeyId,
			section: section,
			question: questionUrl,
			backLink: complete ? this.generateBackUrl(this.generateBackUrl(baseBackLink)) : baseBackLink,
			notificationPreviewTemplate: questionUrl + (complete ? '-complete' : ''),
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
