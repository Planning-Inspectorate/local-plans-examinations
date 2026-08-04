import type { Handler } from 'express';

/**
 * Add configuration values to locals.
 */
export function addLocalsConfiguration(): Handler {
	return (req, res, next) => {
		const path = req.path;
		const cookieConsent = req.cookies?.cookie_consent;

		const links = [
			{
				text: 'Guidance',
				href: '/guidance'
			},
			{
				text: 'Account settings',
				href: '/accountSettings'
			},
			{
				text: 'Manage users',
				href: '/manageUsers'
			}
		];

		res.locals.config = {
			styleFile: 'style-2a4e8a51.css',
			cspNonce: res.locals.cspNonce,
			headerTitle: 'Submit your plan for examination',
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

		if (cookieConsent === 'accept' || cookieConsent === 'reject') {
			res.locals.cookieConsent = cookieConsent;
		}

		next();
	};
}
