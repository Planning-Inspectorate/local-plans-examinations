import { RequiredValidator, type Question } from '@planning-inspectorate/dynamic-forms';

export default class HearingExpectedDaysValidator extends RequiredValidator {
	validate(question: Question) {
		return super
			.validate(question)
			.bail()
			.custom((answer, { req }) => {
				const days = req.body[`${question.fieldName}_hearingExpectedDays`];
				return answer !== 'yes' || /^\d+$/.test(String(days ?? '').trim());
			})
			.withMessage('Expected number of days must be a whole number');
	}
}
