import type { PortalService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-examinations-lib/util/async-handler.ts';

/**
 * Display list of available questionnaires
 */
export function buildQuestionnaireList(service: PortalService): AsyncRequestHandler {
	const { logger } = service;

	return async (req, res) => {
		try {
			// For now, we just have the hello world questionnaire
			const questionnaire = await service.helloWorldService.getQuestionnaire();

			const questionnaires = [
				{
					id: questionnaire.id,
					title: questionnaire.title,
					description: 'A simple questionnaire to test the system',
					url: '/questionnaires/hello-world'
				}
			];

			logger.info({ questionnaireCount: questionnaires.length }, 'Displaying questionnaire list');

			return res.render('views/questionnaires/list/view.njk', {
				pageTitle: 'Available Questionnaires',
				questionnaires
			});
		} catch (error) {
			logger.error({ error }, 'Failed to load questionnaire list');
			return res.status(500).render('views/errors/500.njk');
		}
	};
}
