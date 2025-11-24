/**
 * Configuration object for the questionnaire module in manage app
 *
 * Centralizes all questionnaire-related configuration including
 * template paths, route segments, page titles, and display constants
 * to eliminate magic strings and numbers throughout the application.
 *
 * @constant {Object} QUESTIONNAIRE_CONFIG
 */
export const QUESTIONNAIRE_CONFIG = {
	/** Page titles and headings */
	titles: {
		/** Main questionnaire list page title */
		list: 'Questionnaire Submissions',
		/** Individual submission detail page title */
		detail: 'Questionnaire Submission'
	},

	/** Template file paths for different questionnaire pages */
	templates: {
		/** List view template */
		list: 'views/questionnaire/view.njk',
		/** Detail view template */
		detail: 'views/questionnaire/detail.njk'
	},

	/** Route paths and segments */
	routes: {
		/** Base questionnaire route */
		base: '/questionnaire',
		/** Items dashboard route */
		items: '/items',
		/** Detail route parameter */
		detailParam: ':id'
	},

	/** Display constants */
	display: {
		/** Text shown when email is not provided */
		emailNotProvided: 'Not Provided',
		/** Back link text for detail page */
		backLinkText: 'Back to questionnaire list'
	},

	/** Database query filters */
	filters: {
		/** Filter for active (non-deleted) records */
		active: { isDeleted: false }
	}
} as const;
