import { type IRouter, Router as createRouter } from 'express';
import { addCaseNavigation, buildGetJourneyMiddleware, updateCaseField } from './controller.ts';
import type { ManageService } from '#service';
import {
	buildGetJourney,
	buildList,
	buildSave,
	question,
	validate,
	validationErrorHandler
} from '@planning-inspectorate/dynamic-forms';
import { questions } from './questions.ts';
import {
	createOverviewJourney,
	createGateway1Journey,
	createGateway2Journey,
	GATEWAY_1_JOURNEY_ID,
	GATEWAY_2_JOURNEY_ID,
	OVERVIEW_JOURNEY_ID
} from './journey.ts';

export function caseRouter(service: ManageService): IRouter {
	const router = createRouter({ mergeParams: true });
	const getOverviewJourney = buildGetJourney((req, journeyResponse) =>
		createOverviewJourney(req, journeyResponse, questions)
	);
	const getGateway1Journey = buildGetJourney((req, journeyResponse) =>
		createGateway1Journey(req, journeyResponse, questions)
	);
	const getGateway2Journey = buildGetJourney((req, journeyResponse) =>
		createGateway2Journey(req, journeyResponse, questions)
	);
	const getOverviewJourneyResponse = buildGetJourneyMiddleware(service, OVERVIEW_JOURNEY_ID);
	const getGateway1JourneyResponse = buildGetJourneyMiddleware(service, GATEWAY_1_JOURNEY_ID);
	const getGateway2JourneyResponse = buildGetJourneyMiddleware(service, GATEWAY_2_JOURNEY_ID);
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
		validate,
		validationErrorHandler,
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
		validate,
		validationErrorHandler,
		buildSave(updateCase, true)
	);

	/*
	 * Gateway 2
	 */
	router.get('/gateway-2', getGateway2JourneyResponse, getGateway2Journey, buildList());
	router.get(
		'/gateway-2/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}',
		getGateway2JourneyResponse,
		getGateway2Journey,
		question
	);
	router.post(
		'/gateway-2/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}',
		getGateway2JourneyResponse,
		getGateway2Journey,
		validate,
		validationErrorHandler,
		buildSave(updateCase, true)
	);

	return router;
}
