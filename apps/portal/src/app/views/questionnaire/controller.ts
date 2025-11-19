import type { PortalService } from '#service';
import type { Request, Response } from 'express';
import { QuestionnaireService } from './core/service.ts';
import { QUESTIONNAIRE_CONFIG } from './core/config.ts';

export const createQuestionnaireControllers = (portalService: PortalService) => {
	const questionnaireService = new QuestionnaireService(portalService);

	const startJourney = (req: Request, res: Response) => {
		portalService.logger.info('Displaying questionnaire start page');
		res.render(QUESTIONNAIRE_CONFIG.templates.start, {
			pageTitle: 'Local Plans Questionnaire'
		});
	};

	const viewSuccessPage = (req: Request, res: Response) => {
		const { reference, submitted, error } = questionnaireService.getSubmissionFromSession(req);

		console.log('Success page - Session data:', { reference, submitted, error });
		console.log('Success page - Full session:', req.session.questionnaires);

		if (error) {
			console.log('Error found, redirecting to check-your-answers');
			questionnaireService.clearSubmissionFromSession(req);
			return res.redirect('/questionnaire/check-your-answers');
		}

		if (!submitted || !reference) {
			console.log('No submission data found, redirecting to start');
			return res.redirect('/questionnaire');
		}

		console.log('Rendering success page with reference:', reference);
		questionnaireService.clearSubmissionFromSession(req);

		res.render(QUESTIONNAIRE_CONFIG.templates.success, {
			pageTitle: 'Questionnaire submitted successfully',
			reference
		});
	};

	return { startJourney, viewSuccessPage, questionnaireService };
};
