import { type IRouter, Router as createRouter } from 'express';
import { buildGetJourneyMiddleware, updateCaseField } from './controller.ts';
import type { ManageService } from '#service';
import { buildGetJourney, buildList, buildSave, question } from '@planning-inspectorate/dynamic-forms';
import { questions } from './questions.ts';
import { createOverviewJourney } from './journey.ts';

export function caseRouter(service: ManageService): IRouter {
	const router = createRouter({ mergeParams: true });
	const getJourney = buildGetJourney((req, journeyResponse) => createOverviewJourney(req, journeyResponse, questions));
	const getJourneyResponse = buildGetJourneyMiddleware(service);
	const updateCase = updateCaseField(service);

	router.get('/', getJourneyResponse, getJourney, buildList());
	router.get(
		'/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}',
		getJourneyResponse,
		getJourney,
		question
	);

	router.post(
		'/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}',
		getJourneyResponse,
		getJourney,
		buildSave(updateCase, true)
	);

	return router;
}
