import { type IRouter, Router as createRouter } from 'express';
import { buildGetJourneyMiddleware, updateCaseField } from './controller.ts';
import type { ManageService } from '#service';
import { buildGetJourney, buildList, buildSave, question } from '@planning-inspectorate/dynamic-forms';
import { questions } from './questions.ts';
import { createOverviewJourney } from './journey.ts';

export function caseRouter(service: ManageService): IRouter {
	const router = createRouter({ mergeParams: true });
	const getOverviewJourney = buildGetJourney((req, journeyResponse) =>
		createOverviewJourney(req, journeyResponse, questions)
	);
	const getJourneyResponse = buildGetJourneyMiddleware(service);
	const updateCase = updateCaseField(service);

	/**
	 * Case overview
	 */
	router.get('/overview', getJourneyResponse, getOverviewJourney, buildList());
	router.get(
		'/overview/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}',
		getJourneyResponse,
		getOverviewJourney,
		question
	);
	router.post(
		'/overview/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}',
		getJourneyResponse,
		getOverviewJourney,
		buildSave(updateCase, true)
	);

	return router;
}
