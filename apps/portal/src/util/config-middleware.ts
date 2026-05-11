import type { Handler } from 'express';

/**
 * Add configuration values to locals.
 */

type NavLink = {
	text: string;
	href: string;
};

//landing page = Guidance, Account settings, Manage users

type NavBarOptions = 'default' | 'landingPage';

const NavBarOptionsList: Record<NavBarOptions, NavLink[]> = {
	default: [
		{
			text: 'Home',
			href: '/'
		},
		{
			text: 'Questionnaire',
			href: '/questionnaire'
		},
		{
			text: 'Landing Page',
			href: '/landingPage'
		},
		{
			text: 'Plan Page',
			href: '/planPage'
		}
	],
	landingPage: [
		{
			text: 'Guidance',
			href: '/guidancePage'
		},
		{
			text: 'Account settings',
			href: '/accountSettingsPage'
		},
		{
			text: 'Manage users',
			href: '/manageUsersPage'
		}
	]
};

export function addLocalsConfiguration(NavBarOptions: NavBarOptions = 'default'): Handler {
	return (req, res, next) => {
		const path = req.path;

		const links = NavBarOptionsList[NavBarOptions];

		res.locals.config = {
			styleFile: 'style-45585b7f.css',
			cspNonce: res.locals.cspNonce,
			headerTitle: 'A New Service',
			footerLinks: [
				{
					text: 'Terms and conditions',
					href: '/terms-and-conditions'
				},
				{
					text: 'Accessibility statement',
					href: '/accessibility-statement'
				},
				{
					text: 'Privacy',
					href: 'https://www.gov.uk/government/publications/planning-inspectorate-privacy-notices/customer-privacy-notice'
				},
				{
					text: 'Cookies',
					href: '/cookies'
				},
				{
					text: 'Contact',
					href: '/contact'
				}
			],
			primaryNavigationLinks: links.map((l) => {
				const link = { current: false, ...l };
				link.current = link.href === path;
				return link;
			})
		};
		next();
	};
}
