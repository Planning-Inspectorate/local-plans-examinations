import type { RequestHandler } from 'express';
import type { PortalService } from '#service';
import { clearDataFromSession, type JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import type { UploadedFile } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import { JOURNEY_ID } from './journey.ts';

/**
 * The structure of data for the journey answers
 * depends on the fieldName for each question
 */
export interface Gateway2ApplicationAnswers {
	gateway2CoverLetter: UploadedFile[];
}

/**
 * Returns a controller/handler to save the journey answers to the database
 */
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

		clearDataFromSession({ req, journeyId: JOURNEY_ID });
		// res.render('views/layouts/success.njk', { reference: '123456' });
	};
}
