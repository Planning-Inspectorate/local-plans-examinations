// Application constants to maintain consistency across the portal

export const APP_CONSTANTS = {
	APP_NAME: 'Local Plans Examination Service',

	ROUTES: {
		HOME: '/',
		QUESTIONNAIRE: '/questionnaire',
		ERROR: '/error'
	},

	SESSION_KEYS: {
		VISITS: 'visits',
		QUESTIONNAIRES: 'questionnaires'
	},

	DEFAULTS: {
		HTTP_PORT: 8080 as number,
		LOG_LEVEL: 'info',
		NODE_ENV: 'development',
		CACHE_MAX_AGE: '1d'
	}
} as const;

export const UI_CONSTANTS = {
	NAVIGATION: [
		{ text: 'Home', href: APP_CONSTANTS.ROUTES.HOME },
		{ text: 'Questionnaire', href: APP_CONSTANTS.ROUTES.QUESTIONNAIRE }
	],

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
