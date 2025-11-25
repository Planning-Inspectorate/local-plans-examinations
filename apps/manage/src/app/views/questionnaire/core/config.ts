/**
 * Configuration constants for questionnaire management interface
 *
 * Contains template paths, page titles, routes, and display text
 * used throughout the questionnaire management pages.
 */
export const QUESTIONNAIRE_CONFIG = {
	/** Page titles for questionnaire management pages */
	titles: {
		/** List page heading */
		list: 'Questionnaire Submissions',
		/** Detail page heading */
		detail: 'Questionnaire Submission'
	},

	/** Nunjucks template paths */
	templates: {
		/** Template for submissions list */
		list: 'views/questionnaire/view.njk',
		/** Template for submission details */
		detail: 'views/questionnaire/detail.njk'
	},

	/** URL paths for navigation */
	routes: {
		/** Questionnaire section base URL */
		base: '/questionnaire',
		/** Main dashboard URL */
		items: '/items',
		/** URL parameter for submission ID */
		detailParam: ':id'
	},

	/** Text constants for UI display */
	display: {
		/** Placeholder for missing email addresses */
		emailNotProvided: 'Not Provided',
		/** Navigation link text */
		backLinkText: 'Back to questionnaire list'
	},

	/** Prisma query filters */
	filters: {
		/** Excludes soft-deleted submissions */
		active: { isDeleted: false }
	}
} as const;
