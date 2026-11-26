import { buildRouter } from './router.ts';
import { configureNunjucks } from './nunjucks.ts';
import { addLocalsConfiguration } from '#util/config-middleware.ts';
import { createBaseApp } from '@planning-inspectorate/core/app';
import type { Express } from 'express';
import type { PortalService } from '#service';
import type { HelmetCspDirectives } from '@planning-inspectorate/core/middleware';
import cookieParser from 'cookie-parser';

const ANALYTICS_CSP_SOURCES = ['https://*.clarity.ms', 'https://c.bing.com'];

const portalCspDirectives: HelmetCspDirectives = {
	scriptSrc: [
		"'self'",
		(req, res) => `'nonce-${res.locals?.cspNonce}'`,
		...ANALYTICS_CSP_SOURCES,
		'https://www.googletagmanager.com'
	],
	defaultSrc: ["'self'", ...ANALYTICS_CSP_SOURCES],
	connectSrc: ["'self'", ...ANALYTICS_CSP_SOURCES, 'https://*.google-analytics.com', 'https://*.analytics.google.com'],
	fontSrc: ["'self'"],
	imgSrc: ["'self'", ...ANALYTICS_CSP_SOURCES, 'https://*.google-analytics.com', 'https://*.analytics.google.com'],
	styleSrc: ["'self'"]
};

/**
 * @param service
 */
export function createApp(service: PortalService): Express {
	const router = buildRouter(service);
	// create an express app, and configure it for our usage
	return createBaseApp({
		service,
		configureNunjucks,
		router,
		middlewares: [
			cookieParser(),
			addLocalsConfiguration(service.clarityId, service.environment, service.googleAnalyticsId)
		],
		cspDirectives: service.clarityId || service.googleAnalyticsId ? portalCspDirectives : undefined,
		// skip CSRF checks for document uploads
		// lusca csrf middleware is added after multer for these routes
		multiPartFormRoutes: [/\/upload-documents$/]
	});
}
