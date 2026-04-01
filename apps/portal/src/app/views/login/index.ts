import { type IRouter, Router as createRouter } from 'express';
import {
	buildEnterCredentialsPage,
	buildHasCaseReferenceNumberPage,
	buildNoAccessPage,
	buildSubmitHasCaseReferenceNumber
} from './controller.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { PortalService } from '#service';

export function createLoginRoutes(service: PortalService): IRouter {
	const router = createRouter({ mergeParams: true });
	const hasCaseReferencePage = buildHasCaseReferenceNumberPage();
	const submitHasCaseReferenceNumberPage = buildSubmitHasCaseReferenceNumber(service);
	const signInPage = buildEnterCredentialsPage();
	const noAccessPage = buildNoAccessPage();

	router.get('/has-case-reference', asyncHandler(hasCaseReferencePage));
	router.post('/has-case-reference', asyncHandler(submitHasCaseReferenceNumberPage));
	router.get('/no-access', asyncHandler(noAccessPage));
	router.get('/sign-in', asyncHandler(signInPage));

	return router;
}
