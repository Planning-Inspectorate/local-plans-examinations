import { SubmissionCheckWithDate } from './submission-check-with-date.ts';
import { type SubmissionCheckData } from './submission-check.ts';
import { type ManageService } from '#service';
import { questions } from '../questions.ts';
import { checkSoundUnsoundManuallySet } from '../../../util/util.ts';

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
		const existingReportDate = existingExaminationDetails?.soundUnsoundDate;
		const reportDateWasManuallySet = existingReportDate ? await checkSoundUnsoundManuallySet(service, caseId) : false;
		const fileUploadedDate = existingReportDate
			? reportDateWasManuallySet
				? existingReportDate
				: new Date()
			: uploadedFiles.length > 0
				? uploadedFiles[0].dateCreated
				: undefined;
		const planOutcomeText = questions.isSound.options?.find(
			(option: { value: string }) => option.value === existingExaminationDetails?.isSound
		)?.text;
		const documentChangeUrl = `${this.generateBackUrl(originalUrl)}?returnTo=check`;
		return {
			titleHeading: 'Check documents and send notification',
			uploadedFiles: uploadedFiles,
			caseReference: caseReference,
			journeyId: journeyId,
			section: section,
			question: questionUrl,
			backLink: documentChangeUrl,
			documentChangeUrl,
			submitButtonText: 'Confirm and notify',
			additionalFields: [
				{
					name: questions.isSound.title,
					value: planOutcomeText ?? null,
					url: questions.isSound.url,
					query: 'returnTo=check'
				},
				...this.generateAdditionalDateField(fileUploadedDate, questions.soundUnsoundDate.url, 'Date').map((field) => ({
					...field,
					query: 'returnTo=check'
				}))
			],
			notificationTextLPA: "We'll notify the planning authority and MHCLG that the report is ready"
		};
	}
}
