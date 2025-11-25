/**
 * Application-wide constants for the Local Plans Examination Portal
 *
 * Centralized configuration to maintain consistency across the application
 * and provide a single source of truth for common values.
 */

/**
 * Core application constants including routes, session keys, and default values
 *
 * @constant {Object} APP_CONSTANTS
 * @property {string} APP_NAME - Display name of the application
 * @property {Object} ROUTES - Application route paths
 * @property {Object} SESSION_KEYS - Keys used for session storage
 * @property {Object} DEFAULTS - Default configuration values
 */
export const APP_CONSTANTS = {
	/** Application display name */
	APP_NAME: 'Local Plans Examination Service',

	/** Application route paths */
	ROUTES: {
		/** Home page route */
		HOME: '/',
		/** Questionnaire section route */
		QUESTIONNAIRE: '/questionnaire',
		/** Error pages route */
		ERROR: '/error'
	},

	/** Session storage keys */
	SESSION_KEYS: {
		/** Visit counter session key */
		VISITS: 'visits',
		/** Questionnaire data session key */
		QUESTIONNAIRES: 'questionnaires'
	},

	/** Default configuration values */
	DEFAULTS: {
		/** Default HTTP port */
		HTTP_PORT: 8080 as number,
		/** Default log level */
		LOG_LEVEL: 'info',
		/** Default Node environment */
		NODE_ENV: 'development',
		/** Default cache max age */
		CACHE_MAX_AGE: '1d'
	}
} as const;

/**
 * User interface constants including styling and navigation
 *
 * @constant {Object} UI_CONSTANTS
 * @property {string} STYLE_FILE - CSS file name with hash for cache busting
 * @property {Array} NAVIGATION - Primary navigation menu items
 * @property {Array} FOOTER_LINKS - Footer navigation links
 */
export const UI_CONSTANTS = {
	/** CSS file name with cache-busting hash */
	STYLE_FILE: 'style-9ac0aae2.css',

	/** Primary navigation menu items */
	NAVIGATION: [
		{ text: 'Home', href: APP_CONSTANTS.ROUTES.HOME },
		{ text: 'Questionnaire', href: APP_CONSTANTS.ROUTES.QUESTIONNAIRE }
	],

	/** Footer navigation links */
	FOOTER_LINKS: [
		{ text: 'Terms and conditions', href: '/terms-and-conditions' },
		{ text: 'Accessibility statement', href: '/accessibility-statement' },
		{
			text: 'Privacy',
			href: 'https://www.gov.uk/government/publications/planning-inspectorate-privacy-notices/customer-privacy-notice'
		},
		{ text: 'Cookies', href: '/cookies' },
		{ text: 'Contact', href: '/contact' }
	]
} as const;
