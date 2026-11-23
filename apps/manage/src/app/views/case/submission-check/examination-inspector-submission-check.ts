import type { ManageService } from '#service';
import type { AuthSession } from '#util/cached-entra-client.ts';
import type { Request } from 'express';
import { questions } from '../questions.ts';
import { formatDateToString } from '../../../util/date.ts';
import { EXAMINING_INSPECTOR_FIELDS } from '../../../classes/case-field-mappings.ts';
import { SubmissionCheck, type SubmissionCheckData } from './submission-check.ts';

export class ExaminationInspectorSubmissionCheck extends SubmissionCheck {
	public async generateDataForPage(
		caseId: string,
		caseReference: string,
		journeyId: string,
		section: string,
		questionUrl: string,
		originalUrl: string,
		service: ManageService,
		_uploadedFiles: unknown,
		_questionTitle?: unknown,
		req?: Request
	): Promise<SubmissionCheckData> {
		const examinationInfo = await service.db.examinationInfo.findUnique({
			where: { caseId },
			select: {
				examiningInspector1: true,
				examiningInspector2: true,
				examiningInspector3: true,
				examiningInspectorAppointmentDate: true
			}
		});

		const entraClient = req ? service.getEntraClient(req.session as AuthSession) : null;
		const inspectorAnswers = await Promise.all(
			EXAMINING_INSPECTOR_FIELDS.map(async (field, index) => {
				const inspectorId = examinationInfo?.[field];
				if (!inspectorId) return null;
				const displayName = entraClient ? await entraClient.getUserDisplayName(inspectorId) : inspectorId;
				return {
					name: `Examining Inspector ${index + 1}`,
					value: displayName,
					url: `/case/${caseReference}/${journeyId}/${section}/${questions[field].url}?returnTo=check`
				};
			})
		);

		return {
			titleHeading: 'Confirm and send notification',
			answersToReview: [
				...inspectorAnswers.filter((answer) => answer !== null),
				{
					name: questions.examiningInspectorAppointmentDate.title,
					value: examinationInfo?.examiningInspectorAppointmentDate
						? formatDateToString(examinationInfo.examiningInspectorAppointmentDate)
						: null,
					url: `/case/${caseReference}/${journeyId}/${section}/${questionUrl}?returnTo=check`
				}
			],
			caseReference,
			journeyId,
			section,
			question: questionUrl,
			backLink: this.generateBackUrl(originalUrl),
			submitButtonText: 'Confirm and send',
			notificationTextLPA: 'A notification will be sent to the examining inspectors and the planning authority.'
		};
	}
}
