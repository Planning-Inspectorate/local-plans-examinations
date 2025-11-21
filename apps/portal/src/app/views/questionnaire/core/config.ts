/**
 * Configuration object for the questionnaire module
 *
 * Centralizes all questionnaire-related configuration including
 * template paths, route segments, and identifiers used throughout
 * the dynamic forms integration.
 *
 * @constant {Object} QUESTIONNAIRE_CONFIG
 * @property {string} id - Unique identifier for the questionnaire journey
 * @property {Object} templates - Nunjucks template file paths
 * @property {Object} routes - Route segment names for questionnaire pages
 */
export const QUESTIONNAIRE_CONFIG = {
	/** Unique identifier for the questionnaire journey in dynamic-forms */
	id: 'questionnaire',

	/** Template file paths for different questionnaire pages */
	templates: {
		/** Landing page template */
		start: 'views/questionnaire/templates/form-start.njk',
		/** Individual question page template */
		question: 'views/layouts/forms-question.njk',
		/** Review answers page template */
		checkAnswers: 'views/layouts/forms-check-your-answers.njk',
		/** Success confirmation page template */
		success: 'views/questionnaire/templates/form-success.njk'
	},

	/** Route segment names for questionnaire navigation */
	routes: {
		/** Check answers page route segment */
		checkAnswers: 'check-your-answers',
		/** Success page route segment */
		success: 'success'
	}
} as const;
