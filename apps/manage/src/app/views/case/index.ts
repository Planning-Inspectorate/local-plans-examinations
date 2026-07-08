import { type IRouter, Router as createRouter } from 'express';
import { buildGetJourneyMiddleware, updateCaseField } from './controller.ts';
import type { ManageService } from '#service';
import { buildGetJourney, buildList, buildSave, question } from '@planning-inspectorate/dynamic-forms';
import { questions } from './questions.ts';
import { createOverviewJourney, gateway1Journey } from './journey.ts';

export function caseRouter(service: ManageService): IRouter {
	const router = createRouter({ mergeParams: true });
	const getOverviewJourney = buildGetJourney((req, journeyResponse) =>
		createOverviewJourney(req, journeyResponse, questions)
	);
	const getGateway1Journey = buildGetJourney((req, journeyResponse) =>
		gateway1Journey(req, journeyResponse, questions)
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

	/**
	 * Gateway 1
	 */
	router.get('/gateway-1', getJourneyResponse, getGateway1Journey, buildList());
	router.get('/gateway-1/:section/:question', getJourneyResponse, getGateway1Journey, question);
	router.post('/gateway-1/:section/:question', getJourneyResponse, getGateway1Journey, buildSave(updateCase, true));

	return router;
}
