import { buildRouter } from './router.ts';
import { configureNunjucks } from './nunjucks.ts';
import { addLocalsConfiguration } from '#util/config-middleware.ts';
import { createBaseApp } from '@pins/local-plans-lib/app/app.ts';
import type { Express } from 'express';
import type { PortalService } from '#service';

/**
 * @param service
 */
export function createApp(service: PortalService): Express {
	const router = buildRouter(service);
	// create an express app, and configure it for our usage
	return createBaseApp({ service, configureNunjucks, router, middlewares: [addLocalsConfiguration()] });
}
