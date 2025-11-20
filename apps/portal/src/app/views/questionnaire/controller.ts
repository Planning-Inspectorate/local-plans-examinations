import type { PortalService } from '#service';
import type { Request, Response } from 'express';
import { QuestionnaireService } from './core/service.ts';
import { QUESTIONNAIRE_CONFIG } from './core/config.ts';
import { PrismaQuestionnaireRepository } from './repository.ts';

export const createQuestionnaireControllers = (portalService: PortalService) => {
	const repository = new PrismaQuestionnaireRepository(portalService.db, portalService.logger);
	const questionnaireService = new QuestionnaireService(portalService, repository);

	const startJourney = (req: Request, res: Response) => {
		portalService.logger.info('Displaying questionnaire start page');
		res.render(QUESTIONNAIRE_CONFIG.templates.start, {
			pageTitle: 'Local Plans Questionnaire'
		});
	};

	const viewSuccessPage = (req: Request, res: Response) => {
		const { reference, submitted, error } = questionnaireService.getSubmissionFromSession(req);

		portalService.logger.info(
			`Displaying questionnaire success page - reference: ${reference}, submitted: ${submitted}, hasError: ${!!error}`
		);

		if (error) {
			portalService.logger.warn(`Error found in submission: ${error}, redirecting to check answers`);
			questionnaireService.clearSubmissionFromSession(req);
			return res.redirect('/questionnaire/check-your-answers');
		}

		if (!submitted || !reference) {
			portalService.logger.warn('No submission data found, redirecting to start');
			return res.redirect('/questionnaire');
		}

		portalService.logger.info(`Rendering success page with reference: ${reference}`);
		questionnaireService.clearSubmissionFromSession(req);

		res.render(QUESTIONNAIRE_CONFIG.templates.success, {
			pageTitle: 'Questionnaire submitted successfully',
			reference
		});
	};

	return { startJourney, viewSuccessPage, questionnaireService };
};
