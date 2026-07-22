import { type IRouter, Router as createRouter } from 'express';
import { addCaseNavigation, buildGetJourneyMiddleware, updateCaseField } from './controller.ts';
import type { ManageService } from '#service';
import {
	buildGetJourney,
	buildList,
	buildSave,
	question,
	validate,
	validationErrorHandler,
	type Journey,
	type JourneyResponse
} from '@planning-inspectorate/dynamic-forms';
import type { Request } from 'express';
import { questions } from './questions.ts';
import {
	createOverviewJourney,
	createGateway1Journey,
	createGateway2Journey,
	GATEWAY_1_JOURNEY_ID,
	GATEWAY_2_JOURNEY_ID,
	OVERVIEW_JOURNEY_ID
} from './journey.ts';

type JourneyFactory = (req: Request, response: JourneyResponse, questions: Record<string, any>) => Journey;

interface CaseJourneyConfig {
	path: string;
	journeyId: string;
	createJourney: JourneyFactory;
	supportsManageList?: boolean;
}

/** To add a new route, add a new object here **/
const CASE_JOURNEYS: CaseJourneyConfig[] = [
	{
		path: 'overview',
		journeyId: OVERVIEW_JOURNEY_ID,
		createJourney: createOverviewJourney,
		supportsManageList: true
	},
	{
		path: 'gateway-1',
		journeyId: GATEWAY_1_JOURNEY_ID,
		createJourney: createGateway1Journey
	},
	{
		path: 'gateway-2',
		journeyId: GATEWAY_2_JOURNEY_ID,
		createJourney: createGateway2Journey,
		supportsManageList: true
	}
];

export function caseRouter(service: ManageService): IRouter {
	const router = createRouter({ mergeParams: true });
	const updateCase = updateCaseField(service);

	router.use(addCaseNavigation());

	for (const config of CASE_JOURNEYS) {
		registerCaseJourney(router, service, config, updateCase);
	}

	return router;
}

function registerCaseJourney(
	router: IRouter,
	service: ManageService,
	config: CaseJourneyConfig,
	updateCase: ReturnType<typeof updateCaseField>
): void {
	const { path, journeyId, createJourney, supportsManageList } = config;

	const getJourney = buildGetJourney((req, journeyResponse) => createJourney(req, journeyResponse, questions));
	const getJourneyResponse = buildGetJourneyMiddleware(service, journeyId);

	const questionPath = supportsManageList
		? `/${path}/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}`
		: `/${path}/:section/:question`;

	// List view
	router.get(`/${path}`, getJourneyResponse, getJourney, buildList());

	// Single question view
	router.get(questionPath, getJourneyResponse, getJourney, question);

	// Save answer
	router.post(
		questionPath,
		getJourneyResponse,
		getJourney,
		validate,
		validationErrorHandler,
		buildSave(updateCase, true)
	);
}
