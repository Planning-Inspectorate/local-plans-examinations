import { type IRouter, Router as createRouter, type NextFunction, type Response } from 'express';
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
import * as authSession from '../../auth/session.service.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';

type JourneyFactory = (req: Request, response: JourneyResponse, questions: Record<string, any>) => Journey;

interface CaseJourneyConfig {
	path: string;
	journeyId: string;
	createJourney: JourneyFactory;
	supportsManageList?: boolean;
}

function buildInspectorOptions(service: ManageService) {
	return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
		const entraClient = service.getEntraClient(req.session as authSession.SessionWithAuth);
		if (!entraClient) {
			// Leave the default options
			next();
			return;
		}
		console.log('cuatro');
		const inspectorIds = await entraClient?.listAllGroupMembers(service.entraGroupIds.inspectors);
		let options: { value: string; text: string }[] = [];
		if (inspectorIds) {
			options = [{ value: '', text: '' }, ...inspectorIds.map((m) => ({ value: m.id, text: m.displayName }))];
		}
		questions.examiningInspector1.options = options;
		questions.examiningInspector2.options = options;
		questions.examiningInspector3.options = options;
		questions.qaInspector1.options = options;
		questions.qaInspector2.options = options;
		questions.qaInspector3.options = options;
		next();
	});
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
	router.get(`/${path}`, getJourneyResponse, buildInspectorOptions(service), getJourney, buildList());

	// Single question view
	router.get(questionPath, getJourneyResponse, buildInspectorOptions(service), getJourney, question);

	// Save answer
	router.post(
		questionPath,
		getJourneyResponse,
		buildInspectorOptions(service),
		getJourney,
		validate,
		validationErrorHandler,
		buildSave(updateCase, true)
	);
}
