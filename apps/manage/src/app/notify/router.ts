import { Router as createRouter } from 'express';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { buildNotifyCallbackController } from './controller.ts';
import { buildNotifyCallbackTokenValidator } from '#util/notify-callback.ts';
import type { ManageService } from '#service';

export function createNotifyRoutes(service: ManageService) {
	const router = createRouter();
	router.post(
		'/callback',
		buildNotifyCallbackTokenValidator(service),
		asyncHandler(buildNotifyCallbackController(service))
	);
	return router;
}
