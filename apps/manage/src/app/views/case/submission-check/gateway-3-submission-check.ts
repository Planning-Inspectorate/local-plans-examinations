import { SubmissionCheck, type SubmissionCheckData } from './submission-check.ts';
import { type ManageService } from '#service';
import { GATEWAY_3_DECISION_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';
import { sortGateway3Submissions } from '#util/util.ts';

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
		const submissionId = Number(questionUrl.split('-').at(-1));
		const existingGatewayDetails = await service.db.gateway3Info.findUnique({
			select: {
				submissions: true
			},
			where: {
				caseId: caseId
			}
		});
		if (!existingGatewayDetails?.submissions) {
			throw Error(`Decisions was null or empty for case '${caseId}'`);
		}
		const currentSubmission = sortGateway3Submissions(existingGatewayDetails?.submissions).at(submissionId - 1);
		const complete = currentSubmission?.completionDate;
		const decisionMap: Record<string, string> = {
			[GATEWAY_3_DECISION_ID.PROCEED_TO_EXAMINATION]: 'Proceed to examination',
			[GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED]: 'Resubmission required'
		};
		if (!currentSubmission?.decision) {
			throw Error(
				`A decision must be defined in the data for the case '${caseId}' when entering Gateway3SubmissionCheck`
			);
		}
		const decisionText = decisionMap[currentSubmission?.decision] ?? null;
		if (!decisionText) {
			throw Error(
				`Undefined decision number found for gateway3Info.decision value '${currentSubmission?.decision}' in Gateway3SubmissionCheck`
			);
		}
		return {
			titleHeading: 'Check gateway 3 decision and report details',
			uploadedFiles: uploadedFiles,
			caseReference: caseReference,
			journeyId: journeyId,
			section: section,
			question: questionUrl,
			backLink: `${this.generateBaseUrl(originalUrl)}/gateway-3`,
			notificationPreviewTemplate: 'gateway-3-document' + (complete ? '-complete' : ''),
			submitButtonText: 'Issue decision',
			additionalFields: [
				{
					name: 'Outcome',
					value: decisionText,
					url: `gateway-3-decision-${submissionId}`
				}
			]
		};
	}
}
