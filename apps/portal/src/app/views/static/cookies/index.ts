import { Router as createRouter } from 'express';
import type { IRouter, Request, Response } from 'express';

const COOKIE_NAME = 'cookie_consent';
const COOKIE_DURATION_DAYS = 365;

/**
 * Get cookie consent value from request
 */
function getCookieConsent(req: Request): string | null {
	return req.cookies[COOKIE_NAME] || null;
}

/**
 * Set cookie consent cookie
 */
function setCookieConsent(res: Response, value: string): void {
	const maxAge = COOKIE_DURATION_DAYS * 24 * 60 * 60 * 1000;
	res.cookie(COOKIE_NAME, value, {
		maxAge,
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict',
		path: '/'
	});
}

/**
 * GET /cookies - Display cookie policy and preferences
 */
function getCookiesPage(req: Request, res: Response): void {
	const cookieConsent = getCookieConsent(req);

	res.render('views/static/cookies/cookies.njk', {
		cookieConsent,
		updated: req.query.updated === 'true'
	});
}

/**
 * POST /cookies - Save cookie preferences
 */
function postCookiesPage(req: Request, res: Response): void {
	const { analytics } = req.body;

	if (analytics === 'accept' || analytics === 'reject') {
		setCookieConsent(res, analytics);
	}

	res.redirect('/cookies?updated=true');
}

/**
 * Create cookies routes
 */
export function createCookiesRoutes(): IRouter {
	const router = createRouter();

	router.get('/cookies', getCookiesPage);
	router.post('/cookies', postCookiesPage);

	return router;
}
