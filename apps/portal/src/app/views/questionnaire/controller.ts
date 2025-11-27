import type { PortalService } from '#service';
import type { Request, Response } from 'express';
import { QuestionnaireService, SessionManager } from './core/service.ts';
import { QUESTIONNAIRE_CONFIG } from './core/config.ts';
import { QuestionnaireService as QuestionnaireDataService } from './data/service.ts';

// Handles questionnaire page requests with session validation
class QuestionnaireController {
	private readonly service: QuestionnaireService;
	private readonly logger: PortalService['logger'];

	constructor(service: QuestionnaireService, logger: PortalService['logger']) {
		this.service = service;
		this.logger = logger;
	}

	startJourney = (req: Request, res: Response) => {
		this.logger.info('Displaying questionnaire start page');
		res.render(QUESTIONNAIRE_CONFIG.templates.start, {
			pageTitle: 'Local Plans Questionnaire'
		});
	};

	// Validates session and shows success page or redirects appropriately
	viewSuccessPage = (req: Request, res: Response) => {
		const session = SessionManager.get(req);
		this.logger.info(`Success page request - reference: ${session.reference}, submitted: ${session.submitted}`);

		if (session.error) return this.handleSessionError(req, res, session.error);
		if (!session.submitted || !session.reference) return this.handleMissingSession(res);

		return this.renderSuccessPage(req, res, session.reference);
	};

	// Recovers from corrupted session by clearing and redirecting
	private handleSessionError(req: Request, res: Response, error: string) {
		this.logger.warn(`Session error: ${error}, redirecting to check answers`);
		SessionManager.clear(req);
		return res.redirect('/questionnaire/check-your-answers');
	}

	private handleMissingSession(res: Response) {
		this.logger.warn('No submission data found, redirecting to start');
		return res.redirect('/questionnaire');
	}

	private renderSuccessPage(req: Request, res: Response, reference: string) {
		this.logger.info(`Rendering success page with reference: ${reference}`);
		SessionManager.clear(req);
		res.render(QUESTIONNAIRE_CONFIG.templates.success, {
			pageTitle: 'Questionnaire submitted successfully',
			reference
		});
	}
}

// Factory for creating controllers with dependency injection
export const createQuestionnaireControllers = (portalService: PortalService) => {
	const questionnaireDataService = new QuestionnaireDataService(portalService.db, portalService.logger);
	const questionnaireService = new QuestionnaireService(portalService.logger, questionnaireDataService);
	const controller = new QuestionnaireController(questionnaireService, portalService.logger);

	return {
		startJourney: controller.startJourney,
		viewSuccessPage: controller.viewSuccessPage,
		questionnaireService
	};
};
