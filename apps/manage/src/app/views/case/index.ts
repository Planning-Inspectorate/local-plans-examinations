import { type IRouter, Router as createRouter } from 'express';
import { buildCasePage } from './controller.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { ManageService } from '#service';

export function createCaseRoutes(service: ManageService): IRouter {
	const router = createRouter({ mergeParams: true });
	const casePage = buildCasePage(service);

	router.get('/:reference', asyncHandler(casePage));

	router.get(
		'/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}',
		// validateIdFormat,
		getJourneyResponse,
		getQuestionJourney,
		// addSuccessBannerFromMessage,
		asyncHandler(question)
	);

	return router;
}
