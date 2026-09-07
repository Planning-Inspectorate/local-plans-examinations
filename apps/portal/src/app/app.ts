import { buildRouter } from './router.ts';
import { configureNunjucks } from './nunjucks.ts';
import { addLocalsConfiguration } from '#util/config-middleware.ts';
import { createBaseApp } from '@planning-inspectorate/core/app';
import type { Express } from 'express';
import type { PortalService } from '#service';
import type { HelmetCspDirectives } from '@planning-inspectorate/core/middleware';
import cookieParser from 'cookie-parser';

const CLARITY_CSP_SOURCES = ['https://*.clarity.ms', 'https://c.bing.com'];

const portalCspDirectives: HelmetCspDirectives = {
	scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals?.cspNonce}'`, ...CLARITY_CSP_SOURCES],
	defaultSrc: ["'self'", ...CLARITY_CSP_SOURCES],
	connectSrc: ["'self'", ...CLARITY_CSP_SOURCES],
	fontSrc: ["'self'"],
	imgSrc: ["'self'", ...CLARITY_CSP_SOURCES],
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
		middlewares: [cookieParser(), addLocalsConfiguration(service.clarityId)],
		cspDirectives: service.clarityId ? portalCspDirectives : undefined
	});
}
