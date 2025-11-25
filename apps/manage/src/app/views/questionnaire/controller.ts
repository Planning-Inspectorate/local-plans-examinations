import type { ManageService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { QuestionnaireService, QuestionnaireDataService } from './service.ts';
import { QUESTIONNAIRE_CONFIG } from './core/config.ts';

/**
 * Builds questionnaire list controller for manage app
 *
 * Creates controller that displays all questionnaire submissions with statistics.
 * Renders list view with submission count and data for internal staff review.
 *
 * @param {ManageService} service - Manage app service containing database and logger
 * @returns {AsyncRequestHandler} Express request handler for questionnaire list
 */
export function buildQuestionnaireList(service: ManageService): AsyncRequestHandler {
	const { db, logger } = service;
	return async (req, res) => {
		logger.info('questionnaire list');

		const questionnaireDataService = new QuestionnaireDataService(db, logger);
		const questionnaireService = new QuestionnaireService(logger, questionnaireDataService);
		const totalCount = await questionnaireService.getTotalSubmissions();
		const submissions = await questionnaireService.getAllSubmissions();

		return res.render(QUESTIONNAIRE_CONFIG.templates.list, {
			pageHeading: QUESTIONNAIRE_CONFIG.titles.list,
			totalCount,
			submissions,
			questionnaireConfig: {
				questionnaireRoute: QUESTIONNAIRE_CONFIG.routes.base,
				itemsRoute: QUESTIONNAIRE_CONFIG.routes.items,
				emailNotProvided: QUESTIONNAIRE_CONFIG.display.emailNotProvided
			}
		});
	};
}

/**
 * Builds questionnaire detail controller for manage app
 *
 * Creates controller that displays individual questionnaire submission details.
 * Handles 404 cases for non-existent submissions and renders detail view.
 *
 * @param {ManageService} service - Manage app service containing database and logger
 * @returns {AsyncRequestHandler} Express request handler for questionnaire detail
 */
export function buildQuestionnaireDetail(service: ManageService): AsyncRequestHandler {
	const { db, logger } = service;
	return async (req, res) => {
		const { id } = req.params;
		logger.info(`questionnaire detail: ${id}`);

		const questionnaireDataService = new QuestionnaireDataService(db, logger);
		const questionnaireService = new QuestionnaireService(logger, questionnaireDataService);
		const submission = await questionnaireService.getSubmissionById(id);

		if (!submission) {
			return res.status(404).render('views/errors/404.njk');
		}

		return res.render(QUESTIONNAIRE_CONFIG.templates.detail, {
			pageHeading: QUESTIONNAIRE_CONFIG.titles.detail,
			submission,
			questionnaireConfig: {
				backLinkText: QUESTIONNAIRE_CONFIG.display.backLinkText,
				backLinkHref: QUESTIONNAIRE_CONFIG.routes.base,
				emailNotProvided: QUESTIONNAIRE_CONFIG.display.emailNotProvided
			}
		});
	};
}
