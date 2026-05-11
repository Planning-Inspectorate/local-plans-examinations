import { Router as createRouter } from 'express';
import { buildQuestionnairePage } from './controller.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { PortalService } from '#service';

export function createQuestionnaireRoutes(service: PortalService) {
	const router = createRouter({ mergeParams: true });
	const controller = buildQuestionnairePage(service);

	router.get('/questionnaire', asyncHandler(controller));

	router.post(
		'/questionnaire',
		asyncHandler(async (req, res) => {
			const data = req.body;

			console.log(data);

			if (!data.fullName) {
				return res.status(400).send('Full name required');
			}

			res.redirect('/success');
		})
	);

	return router;
}
