import { Router as createRouter } from 'express';
import { asyncHandler } from '@pins/local-plans-examinations-lib/util/async-handler.ts';
import { buildQuestionnaireList, buildQuestionnaireResponses, buildAnalyticsDashboard } from './list/controller.ts';
import type { ManageService } from '#service';
import type { IRouter } from 'express';

export function createQuestionnaireRoutes(service: ManageService): IRouter {
	const router = createRouter({ mergeParams: true });

	// Questionnaire management routes
	const questionnaireList = buildQuestionnaireList(service);
	const questionnaireResponses = buildQuestionnaireResponses(service);
	const analyticsDashboard = buildAnalyticsDashboard(service);

	router.get('/', asyncHandler(questionnaireList));
	router.get('/analytics', asyncHandler(analyticsDashboard));
	router.get('/:id/responses', asyncHandler(questionnaireResponses));

	return router;
}
