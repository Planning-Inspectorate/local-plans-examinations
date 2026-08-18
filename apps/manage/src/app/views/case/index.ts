import { type IRouter, type Request, Router as createRouter } from 'express';
import {
	addCaseNavigation,
	buildGetJourneyMiddleware,
	updateCaseField,
	getDeleteCase,
	postMarkAsDeleteCase
} from './controller.ts';
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
import { questions } from './questions.ts';
import {
	createOverviewJourney,
	createGateway1Journey,
	createGateway2Journey,
	createGateway3Journey,
	createExaminationJourney,
	GATEWAY_1_JOURNEY_ID,
	GATEWAY_2_JOURNEY_ID,
	GATEWAY_3_JOURNEY_ID,
	OVERVIEW_JOURNEY_ID,
	EXAMINATION_JOURNEY_ID
} from './journey.ts';
import { buildCaseOfficerOptions, buildInspectorOptions } from '../../util/options-helper.ts';

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
	},
	{
		path: 'gateway-3',
		journeyId: GATEWAY_3_JOURNEY_ID,
		createJourney: createGateway3Journey
	},
	{
		path: 'examination',
		journeyId: EXAMINATION_JOURNEY_ID,
		createJourney: createExaminationJourney,
		supportsManageList: true
	}
];

export function caseRouter(service: ManageService): IRouter {
	console.log('Building case router');
	const router = createRouter({ mergeParams: true });
	const updateCase = updateCaseField(service);

	router.use(addCaseNavigation());

	for (const config of CASE_JOURNEYS) {
		registerCaseJourney(router, service, config, updateCase);
	}

	/**
	 * Delete case
	 */
	router.get('/delete-case', getDeleteCase(service));
	router.post('/delete-case', postMarkAsDeleteCase(service));

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
	router.get(
		`/${path}`,
		getJourneyResponse,
		buildCaseOfficerOptions(service, questions),
		buildInspectorOptions(service, questions),
		getJourney,
		buildList()
	);

	// Single question view
	router.get(
		questionPath,
		getJourneyResponse,
		buildCaseOfficerOptions(service, questions),
		buildInspectorOptions(service, questions),
		getJourney,
		question
	);

	// Save answer
	router.post(
		questionPath,
		getJourneyResponse,
		buildCaseOfficerOptions(service, questions),
		buildInspectorOptions(service, questions),
		getJourney,
		validate,
		validationErrorHandler,
		buildSave(updateCase, true)
	);
}
