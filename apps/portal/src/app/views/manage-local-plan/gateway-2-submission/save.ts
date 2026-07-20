import type { Request, RequestHandler } from 'express';
import type { PortalService } from '#service';
import { clearDataFromSession, type JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import type { UploadedFile } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import { JOURNEY_ID } from './journey.ts';

// Defines the answers saved for the Gateway 2 journey.
export interface Gateway2ApplicationAnswers {
	gateway2CoverLetter: UploadedFile[];
	gateway2LocalPlanTimetable: UploadedFile[];
}

// Creates the controller that handles the final Gateway 2 submission.
export function buildSaveController(service: PortalService): RequestHandler {
	return async (req, res) => {
		if (!res.locals || !res.locals.journeyResponse) {
			throw new Error('journey response required');
		}
		const journeyResponse = res.locals.journeyResponse as JourneyResponse;
		const answers = journeyResponse.answers as unknown as Gateway2ApplicationAnswers;
		if (typeof answers !== 'object') {
			throw new Error('answers should be an object');
		}

		// Code for submitted plan
		service.logger.info(answers, 'Plan submitted');

		// Clears the Gateway 2 journey answers after submission.
		const planReference = getRoutePlanReference(req);
		if (planReference) {
			clearDataFromSession({ req, journeyId: JOURNEY_ID, reqParam: 'planReference' });
			return res.redirect(
				`/manage-local-plans/${encodeURIComponent(planReference)}/gateway-2-application/application-complete`
			);
		}

		clearDataFromSession({ req, journeyId: JOURNEY_ID });
		return res.redirect('/manage-local-plans/your-plans');
	};
}

function getRoutePlanReference(req: Request): string | undefined {
	const planReference = Array.isArray(req.params.planReference)
		? req.params.planReference[0]
		: req.params.planReference;

	return planReference || undefined;
}
