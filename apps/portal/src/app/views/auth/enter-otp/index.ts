import { Router as createRouter } from 'express';
import { getEnterOtp, postEnterOtp } from './controller.ts';
import type { IRouter } from 'express';

export function createEnterOtpRoutes(): IRouter {
	const router = createRouter({ mergeParams: true });

	router.get('/auth/enter-otp', getEnterOtp());
	router.post('/auth/enter-otp', postEnterOtp());

	return router;
}
