import { type IRouter, Router as createRouter } from 'express';
import {
	buildEnterCredentialsPage,
	buildEnterOtpPage,
	buildHasCaseReferenceNumberPage,
	buildNoAccessPage,
	buildSubmitCredentialsPage,
	buildSubmitHasCaseReferenceNumber,
	buildSubmitOtpPage
} from './controller.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { PortalService } from '#service';

export function createLoginRoutes(service: PortalService): IRouter {
	const router = createRouter({ mergeParams: true });
	const hasCaseReferencePage = buildHasCaseReferenceNumberPage();
	const submitHasCaseReferenceNumberPage = buildSubmitHasCaseReferenceNumber(service);
	const signInPage = buildEnterCredentialsPage();
	const submitEmailAndCaseReference = buildSubmitCredentialsPage(service);
	const otpPage = buildEnterOtpPage();
	const noAccessPage = buildNoAccessPage();
	const submitOTP = buildSubmitOtpPage(service);

	router.get('/has-case-reference', asyncHandler(hasCaseReferencePage));
	router.post('/has-case-reference', asyncHandler(submitHasCaseReferenceNumberPage));
	router.get('/sign-in', asyncHandler(signInPage));
	router.post('/sign-in', asyncHandler(submitEmailAndCaseReference));
	router.get('/enter-code', asyncHandler(otpPage));
	router.post('/enter-code', asyncHandler(submitOTP));
	router.get('/no-access', asyncHandler(noAccessPage));

	return router;
}
