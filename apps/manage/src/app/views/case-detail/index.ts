import { ManageService } from '#service';
import { Router, Router as createRouter } from 'express';
import { buildGetJourneyMiddleware, buildUpdateCase } from './controller.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { buildList, buildSave, question } from '@planning-inspectorate/dynamic-forms';
import { getQuestions } from '../create-a-case/questions.ts';

export function caseDetailRoutes(service: ManageService): Router {
	const questions = getQuestions();
	const router = createRouter({ mergeParams: true });
	const getJourney = asyncHandler(buildGetJourneyMiddleware(service, questions));
	const updateCaseHandler = buildUpdateCase(service);
	const updateCase = buildSave(updateCaseHandler, true);

	router.get('/', getJourney, buildList({ hideStatus: true, journeyComplete: false }));
	router.post('/', getJourney, (req, res) => res.redirect('/cases'));
	router.get('/:section/:question', getJourney, asyncHandler(question));
	router.post('/:section/:question', getJourney, asyncHandler(updateCase));
	// router.get('/check-your-answers', getJourney, buildList({hideStatus:true}));
	router.get('/check-your-answers', getJourney, (req, res) => res.redirect(`/cases/${req.params.id}`));

	return router;
}
