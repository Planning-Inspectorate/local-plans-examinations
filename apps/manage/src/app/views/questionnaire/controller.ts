import type { ManageService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { DatabaseService } from '@pins/local-plans-lib/database';
import { QuestionnaireService, QuestionnaireDataService } from './service.ts';
import { QUESTIONNAIRE_CONFIG } from './core/config.ts';

export function buildQuestionnaireList(service: ManageService): AsyncRequestHandler {
	const { db, logger } = service;
	return async (req, res) => {
		logger.info('questionnaire list');

		const databaseService = new DatabaseService(db, logger);
		const questionnaireDataService = new QuestionnaireDataService(databaseService, logger);
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

export function buildQuestionnaireDetail(service: ManageService): AsyncRequestHandler {
	const { db, logger } = service;
	return async (req, res) => {
		const { id } = req.params;
		logger.info(`questionnaire detail: ${id}`);

		const databaseService = new DatabaseService(db, logger);
		const questionnaireDataService = new QuestionnaireDataService(databaseService, logger);
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
