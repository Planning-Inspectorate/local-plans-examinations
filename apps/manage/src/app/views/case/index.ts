import { type IRouter, Router as createRouter } from 'express';
import { addCaseNavigation, buildGetJourneyMiddleware, updateCaseField } from './controller.ts';
import type { ManageService } from '#service';
import { buildGetJourney, buildList, buildSave, question } from '@planning-inspectorate/dynamic-forms';
import { questions } from './questions.ts';
import { createOverviewJourney, gateway1Journey, GATEWAY_1_JOURNEY_ID, OVERVIEW_JOURNEY_ID } from './journey.ts';

export function caseRouter(service: ManageService): IRouter {
	const router = createRouter({ mergeParams: true });
	const getOverviewJourney = buildGetJourney((req, journeyResponse) =>
		createOverviewJourney(req, journeyResponse, questions)
	);
	const getGateway1Journey = buildGetJourney((req, journeyResponse) =>
		gateway1Journey(req, journeyResponse, questions)
	);
	const getOverviewJourneyResponse = buildGetJourneyMiddleware(service, OVERVIEW_JOURNEY_ID);
	const getGateway1JourneyResponse = buildGetJourneyMiddleware(service, GATEWAY_1_JOURNEY_ID);
	const updateCase = updateCaseField(service);
	router.use(addCaseNavigation());

	/**
	 * Case overview
	 */
	router.get('/overview', getOverviewJourneyResponse, getOverviewJourney, buildList());
	router.get(
		'/overview/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}',
		getOverviewJourneyResponse,
		getOverviewJourney,
		question
	);
	router.post(
		'/overview/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}',
		getOverviewJourneyResponse,
		getOverviewJourney,
		buildSave(updateCase, true)
	);

	/**
	 * Gateway 1
	 */
	router.get('/gateway-1', getGateway1JourneyResponse, getGateway1Journey, buildList());
	router.get('/gateway-1/:section/:question', getGateway1JourneyResponse, getGateway1Journey, question);
	router.post(
		'/gateway-1/:section/:question',
		getGateway1JourneyResponse,
		getGateway1Journey,
		buildSave(updateCase, true)
	);

	return router;
}
