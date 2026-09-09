import { buildRouter } from './router.ts';
import { configureNunjucks } from './nunjucks.ts';
import { addLocalsConfiguration } from '#util/config-middleware.ts';
import { createBaseApp } from '@planning-inspectorate/core/app';
import type { Express } from 'express';
import type { ManageService } from '#service';
import cookieParser from 'cookie-parser';

export function createApp(service: ManageService): Express {
	const router = buildRouter(service);
	// create an express app, and configure it for our usage
	return createBaseApp({
		service,
		configureNunjucks,
		router,
		middlewares: [cookieParser(), addLocalsConfiguration()],
		// skip CSRF checks for document uploads
		// lusca csrf middleware is added after multer for these routes
		multiPartFormRoutes: [/\/upload-documents$/]
	});
}
