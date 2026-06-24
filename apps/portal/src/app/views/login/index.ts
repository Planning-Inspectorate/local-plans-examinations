import { type IRouter, Router as createRouter } from 'express';
import rateLimit from 'express-rate-limit';
import {
	buildEnterEmailPage,
	buildEnterOtpPage,
	buildNoAccessPage,
	buildRequestNewCode,
	buildSubmitEmailPage,
	buildSubmitOtpPage
} from './controller.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { PortalService } from '#service';

export function createLoginRoutes(service: PortalService): IRouter {
	const router = createRouter({ mergeParams: true });
	const emailPage = buildEnterEmailPage();
	const submitEmailPage = buildSubmitEmailPage(service);
	const otpPage = buildEnterOtpPage();
	const noAccessPage = buildNoAccessPage();
	const submitOTP = buildSubmitOtpPage(service);
	const requestNewCode = buildRequestNewCode(service);

	// Rate limiter for auth endpoints - only applied in production
	const authRateLimiter = rateLimit({
		windowMs: 15 * 60 * 1000, // 15 minutes
		max: process.env.NODE_ENV === 'production' ? 10 : 1000, // 10 in production, high limit for E2E tests
		message: 'Too many requests, please try again later',
		standardHeaders: true,
		legacyHeaders: false
	});

	router.get('/', asyncHandler(emailPage));
	router.post('/', authRateLimiter, asyncHandler(submitEmailPage));
	router.get('/enter-code', asyncHandler(otpPage));
	router.post('/enter-code', authRateLimiter, asyncHandler(submitOTP));
	router.get('/request-new-code', authRateLimiter, asyncHandler(requestNewCode));
	router.get('/no-access', asyncHandler(noAccessPage));

	return router;
}
