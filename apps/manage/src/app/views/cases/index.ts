import { ManageService } from '#service';
import { Router, Router as createRouter } from 'express';
import {
	// buildGetJourneyMiddleware,
	// buildViewCaseDetails,
	// detailViewCaseController,
	listCasesController
} from './controller.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
// import { question } from '@planning-inspectorate/dynamic-forms';

export function manageCasesRoutes(service: ManageService): Router {
	const router = createRouter({ mergeParams: true });
	const listCases = listCasesController(service);
	// const detailCaseController = detailViewCaseController(service);
	// const detailViewCaseController = buildViewCaseDetails(service);
	// const getJourney = asyncHandler(buildGetJourneyMiddleware(service))

	router.get('/', asyncHandler(listCases));

	// router.get('/:id', getJourney, asyncHandler(detailViewCaseController))
	// router.get('/:id/:section/:question', getJourney, asyncHandler(question))

	return router;
}
