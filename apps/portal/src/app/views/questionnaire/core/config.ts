/**
 * Questionnaire configuration
 */
export const QUESTIONNAIRE_CONFIG = {
	id: 'questionnaire',
	templates: {
		start: 'views/questionnaire/templates/form-start.njk',
		question: 'views/layouts/forms-question.njk',
		checkAnswers: 'views/layouts/forms-check-your-answers.njk',
		success: 'views/questionnaire/templates/form-success.njk'
	},
	routes: {
		checkAnswers: 'check-your-answers',
		success: 'success'
	}
} as const;
