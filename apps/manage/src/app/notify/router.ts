import { Router as createRouter } from 'express';
import { asyncHandler } from '@planning-inspectorate/core/util';
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
