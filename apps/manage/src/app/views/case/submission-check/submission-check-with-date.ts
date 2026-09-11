import { SubmissionCheck } from './submission-check.ts';

export abstract class SubmissionCheckWithDate extends SubmissionCheck {
	protected generateAdditionalDateField(
		documentUploadDate: Date | undefined | null,
		dateUploadedQuestionUrl: string | undefined
	) {
		return [
			{
				name: 'Date uploaded',
				value: documentUploadDate
					? new Intl.DateTimeFormat('en-GB', {
							day: 'numeric',
							month: 'long',
							timeZone: 'Europe/London',
							year: 'numeric'
						}).format(documentUploadDate)
					: null,
				url: dateUploadedQuestionUrl
			}
		];
	}
}
