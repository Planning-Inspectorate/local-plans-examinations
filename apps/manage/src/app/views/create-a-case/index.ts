import type { ManageService } from '#service';
import { type IRouter, Router as createRouter } from 'express';
import {
	buildGetJourney,
	buildGetJourneyResponseFromSession,
	buildList,
	buildSave,
	question,
	saveDataToSession,
	validate,
	validationErrorHandler
} from '@planning-inspectorate/dynamic-forms';
import { createJourney, JOURNEY_ID } from './journey.ts';
import { questions } from './questions.ts';
import { buildSaveController } from './save.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { RequestHandler } from 'express';

export function createACaseRoutes(service: ManageService): IRouter {
	const router = createRouter({ mergeParams: true });

	// read answers from the session
	const getJourneyResponse = buildGetJourneyResponseFromSession(JOURNEY_ID);
	const getJourney = buildGetJourney((req, journeyResponse) => createJourney(req, journeyResponse, questions));
	const saveToSession = asyncHandler(buildSave(saveDataToSession));
	const saveToDatabase = asyncHandler(buildSaveController(service));

	const handleLpaLoop: RequestHandler = (req, res, next) => {
		if (req.path.includes('another-lpa') && req.method === 'POST') {
			const anotherLpa = req.body.anotherLpa;
			const currentLpa = req.body.lpa || req.session.currentLpa;

			if (!req.session.lpaHistory) {
				req.session.lpaHistory = [];
			}

			if (anotherLpa === 'yes') {
				req.session.lpaHistory.push(currentLpa);
				req.session.currentLpa = undefined;
				return res.redirect('/create-a-case/case-details/select-lpa');
			}

			req.session.lpaHistory.push(currentLpa);
		}
		next();
	};

	router.get('/:section/:question', getJourneyResponse, getJourney, question);
	router.post(
		'/:section/:question',
		getJourneyResponse,
		getJourney,
		validate,
		validationErrorHandler,
		handleLpaLoop,
		saveToSession
	);

	router.get('/check-your-answers', getJourneyResponse, getJourney, buildList());
	router.post('/check-your-answers', getJourneyResponse, getJourney, saveToDatabase);

	return router;
}
