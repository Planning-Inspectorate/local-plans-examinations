import { Router as createRouter } from 'express';
import { asyncHandler } from '@pins/local-plans-examinations-lib/util/async-handler.ts';
import { buildQuestionnaireList } from './list/controller.ts';
import { buildHelloWorldForm, buildHelloWorldSubmit, buildHelloWorldComplete } from './hello-world/controller.ts';
import type { PortalService } from '#service';
import type { IRouter } from 'express';

export function createQuestionnaireRoutes(service: PortalService): IRouter {
	const router = createRouter({ mergeParams: true });

	// Questionnaire list
	const questionnaireList = buildQuestionnaireList(service);
	router.get('/', asyncHandler(questionnaireList));

	// Hello World questionnaire routes
	const helloWorldForm = buildHelloWorldForm(service);
	const helloWorldSubmit = buildHelloWorldSubmit(service);
	const helloWorldComplete = buildHelloWorldComplete(service);

	router.get('/hello-world', asyncHandler(helloWorldForm));
	router.post('/hello-world', asyncHandler(helloWorldSubmit));
	router.get('/hello-world/complete', asyncHandler(helloWorldComplete));

	return router;
}
