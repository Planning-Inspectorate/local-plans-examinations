import { Router as createRouter } from 'express';
import type { CookieOptions, IRouter, Request, Response } from 'express';

type CookieConsentValue = 'accept' | 'reject';

interface CookieConsentRequest extends Request {
	cookies: Record<string, string | undefined>;
}

interface CookiePreferencesBody {
	analytics?: string;
}

const COOKIE_NAME: string = 'cookie_consent';
const COOKIE_DURATION_DAYS: number = 365;

/**
 * Get cookie consent value from request
 */
function getCookieConsent(req: CookieConsentRequest): CookieConsentValue | null {
	const value = req.cookies[COOKIE_NAME];
	if (value === 'accept' || value === 'reject') {
		return value;
	}
	return null;
}

/**
 * Set cookie consent cookie
 */
function setCookieConsent(res: Response, value: CookieConsentValue): void {
	const maxAge: number = COOKIE_DURATION_DAYS * 24 * 60 * 60 * 1000;
	const options: CookieOptions = {
		maxAge,
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict',
		path: '/'
	};
	res.cookie(COOKIE_NAME, value, options);
}

/**
 * GET /cookies - Display cookie policy and preferences
 */
function getCookiesPage(req: CookieConsentRequest, res: Response): void {
	const cookieConsent: CookieConsentValue | null = getCookieConsent(req);

	res.render('views/static/cookies/cookies.njk', {
		cookieConsent,
		updated: req.query.updated === 'true'
	});
}

/**
 * POST /cookies - Save cookie preferences
 */
function postCookiesPage(req: Request<object, unknown, CookiePreferencesBody>, res: Response): void {
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
