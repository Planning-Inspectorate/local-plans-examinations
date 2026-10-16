import { SubmissionCheckWithDate } from './submission-check-with-date.ts';
import { type SubmissionCheckData } from './submission-check.ts';
import { type ManageService } from '#service';
import { questions } from '../questions.ts';

export class ExaminationReportSubmissionCheck extends SubmissionCheckWithDate {
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
		const existingExaminationDetails = await service.db.examinationInfo.findUnique({
			select: {
				soundUnsoundDate: true,
				isSound: true
			},
			where: {
				caseId: caseId
			}
		});
		const queryString = originalUrl.split('?')[1] ?? '';
		const returnToCheck = new URLSearchParams(queryString).get('returnTo') === 'check';
		const isAdditionalDocument = Boolean(existingExaminationDetails?.soundUnsoundDate) && !returnToCheck;
		const fileUploadedDate =
			existingExaminationDetails?.soundUnsoundDate ??
			(uploadedFiles.length > 0 ? uploadedFiles[0].dateCreated : undefined);
		const planOutcomeText = questions.isSound.options?.find(
			(option: { value: string }) => option.value === existingExaminationDetails?.isSound
		)?.text;
		return {
			titleHeading: isAdditionalDocument
				? 'Check details and send notification'
				: 'Check documents and send notification',
			uploadedFiles: uploadedFiles,
			caseReference: caseReference,
			journeyId: journeyId,
			section: section,
			question: questionUrl,
			backLink: this.generateBackUrl(originalUrl),
			submitButtonText: 'Confirm and notify',
			additionalFields: isAdditionalDocument
				? []
				: [
						{
							name: questions.isSound.title,
							value: planOutcomeText ?? null,
							url: questions.isSound.url,
							query: 'returnTo=check'
						},
						...this.generateAdditionalDateField(fileUploadedDate, questions.soundUnsoundDate.url, 'Date').map(
							(field) => ({
								...field,
								query: 'returnTo=check'
							})
						)
					],
			notificationTextLPA: "We'll notify the planning authority and MHCLG that the report is ready"
		};
	}
}
