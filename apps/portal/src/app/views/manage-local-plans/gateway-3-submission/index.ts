import type { PortalService } from '#service';
import { type IRouter, Router as createRouter } from 'express';
import { buildGetJourney, buildGetJourneyResponseFromSession } from '@planning-inspectorate/dynamic-forms';
import { createJourney, JOURNEY_ID } from './journey.ts';
import { asyncHandler } from '@planning-inspectorate/core/util';
import { buildGetJourneyResponseFromCase, buildGateway3CheckAnswersList, setGateway3ViewData } from './controller.ts';

export function gateway3SubmissionRoutes(service: PortalService): IRouter {
	const router = createRouter({ mergeParams: true });

	const getJourneyResponse = buildGetJourneyResponseFromSession(JOURNEY_ID);
	const getJourney = buildGetJourney((req, journeyResponse) => createJourney(req, journeyResponse));
	const getJourneyResponseFromCase = asyncHandler(buildGetJourneyResponseFromCase(service));

	router.get(
		'/gateway-3-submission',
		getJourneyResponse,
		getJourney,
		setGateway3ViewData,
		buildGateway3CheckAnswersList()
	);

	router.get(
		'/:planReference/gateway-3-submission',
		getJourneyResponseFromCase,
		getJourney,
		setGateway3ViewData,
		buildGateway3CheckAnswersList()
	);

	return router;
}
