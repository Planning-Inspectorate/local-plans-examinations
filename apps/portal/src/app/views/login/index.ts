import { type IRouter, Router as createRouter } from 'express';
import {
	buildEnterEmailPage,
	buildEnterOtpPage,
	buildNoAccessPage,
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

	router.get('/', asyncHandler(emailPage));
	router.post('/', asyncHandler(submitEmailPage));
	router.get('/enter-code', asyncHandler(otpPage));
	router.post('/enter-code', asyncHandler(submitOTP));
	router.get('/no-access', asyncHandler(noAccessPage));

	return router;
}
