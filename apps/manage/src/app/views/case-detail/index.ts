import { ManageService } from '#service';
import { Router, Router as createRouter } from 'express';
import { buildGetJourneyMiddleware, buildUpdateCase, buildViewCaseDetails } from './controller.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { buildSave, question } from '@planning-inspectorate/dynamic-forms';

export function caseDetailRoutes(service: ManageService): Router {
	const router = createRouter({ mergeParams: true });
	const updateCaseHandler = buildUpdateCase(service);
	const detailViewCaseController = buildViewCaseDetails(service);
	const getJourney = asyncHandler(buildGetJourneyMiddleware(service));
	const updateCase = buildSave(updateCaseHandler, true);

	router.get('/', getJourney, asyncHandler(detailViewCaseController));
	router.get('/:section/:question', getJourney, asyncHandler(question));
	router.post('/:section/:question', getJourney, asyncHandler(updateCase));
	router.get('/check-your-answers', getJourney, asyncHandler(detailViewCaseController));

	return router;
}
