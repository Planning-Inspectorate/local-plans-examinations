import { RequiredValidator, type Question } from '@planning-inspectorate/dynamic-forms';

export default class HearingExpectedDaysValidator extends RequiredValidator {
	validate(question: Question) {
		return super
			.validate(question)
			.bail()
			.custom((answer, { req }) => {
				const days = req.body[`${question.fieldName}_hearingExpectedDays`];
				return answer !== 'yes' || (typeof days === 'string' && days.trim().length > 0);
			})
			.withMessage('Enter the expected number of days');
	}
}
