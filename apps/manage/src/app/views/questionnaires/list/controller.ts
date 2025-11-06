import type { ManageService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-examinations-lib/util/async-handler.ts';

/**
 * Display list of questionnaires in admin interface
 */
export function buildQuestionnaireList(service: ManageService): AsyncRequestHandler {
	const { logger } = service;

	return async (req, res) => {
		try {
			// Get hello world questionnaire and analytics
			const analytics = await service.helloWorldService.getAnalytics();

			const questionnaires = [
				{
					id: analytics.questionnaire.id,
					title: analytics.questionnaire.title,
					status: analytics.questionnaire.isActive ? 'Active' : 'Inactive',
					responseCount: analytics.responseCount,
					createdAt: analytics.questionnaire.createdAt,
					editUrl: `/questionnaires/${analytics.questionnaire.id}/edit`,
					viewResponsesUrl: `/questionnaires/${analytics.questionnaire.id}/responses`
				}
			];

			logger.info({ questionnaireCount: questionnaires.length }, 'Displaying admin questionnaire list');

			return res.render('views/questionnaires/list/view.njk', {
				pageHeading: 'Manage Questionnaires',
				questionnaires
			});
		} catch (error) {
			logger.error({ error }, 'Failed to load admin questionnaire list');
			return res.status(500).render('views/errors/500.njk');
		}
	};
}

/**
 * Display questionnaire responses
 */
export function buildQuestionnaireResponses(service: ManageService): AsyncRequestHandler {
	const { logger } = service;

	return async (req, res) => {
		const questionnaireId = req.params.id;

		try {
			const [questionnaire, responses] = await Promise.all([
				service.helloWorldService.getQuestionnaire(),
				service.helloWorldService.getAllResponses()
			]);

			logger.info({ questionnaireId, responseCount: responses.length }, 'Displaying questionnaire responses');

			return res.render('views/questionnaires/responses/view.njk', {
				pageHeading: `Responses: ${questionnaire.title}`,
				questionnaire: {
					id: questionnaire.id,
					title: questionnaire.title
				},
				responses: responses.map((response: any) => ({
					id: response.id,
					userName: response.userName,
					userMessage: response.userMessage,
					submittedAt: response.submittedAt,
					messagePreview:
						response.userMessage.length > 100 ? response.userMessage.substring(0, 100) + '...' : response.userMessage
				}))
			});
		} catch (error) {
			logger.error({ error, questionnaireId }, 'Failed to load questionnaire responses');
			return res.status(500).render('views/errors/500.njk');
		}
	};
}

/**
 * Display analytics dashboard
 */
export function buildAnalyticsDashboard(service: ManageService): AsyncRequestHandler {
	const { logger } = service;

	return async (req, res) => {
		try {
			const analytics = await service.helloWorldService.getAnalytics();

			logger.info('Displaying analytics dashboard');

			return res.render('views/questionnaires/analytics/view.njk', {
				pageHeading: 'Analytics Dashboard',
				analytics: {
					totalResponses: analytics.responseCount,
					averageMessageLength: analytics.averageMessageLength,
					questionnaire: analytics.questionnaire,
					latestResponses: analytics.latestResponses.map((response: any) => ({
						userName: response.userName,
						submittedAt: response.submittedAt,
						messagePreview:
							response.userMessage.length > 50 ? response.userMessage.substring(0, 50) + '...' : response.userMessage
					}))
				}
			});
		} catch (error) {
			logger.error({ error }, 'Failed to load analytics dashboard');
			return res.status(500).render('views/errors/500.njk');
		}
	};
}
