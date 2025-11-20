import type { PortalService } from '#service';
import type { Request, Response } from 'express';
import { QuestionnaireService, SessionManager } from './core/service.ts';
import { QUESTIONNAIRE_CONFIG } from './core/config.ts';
import { PrismaQuestionnaireRepository } from './repository.ts';

/**
 * Controller class for handling questionnaire page requests
 *
 * Manages questionnaire start page and success page functionality,
 * including session state validation and error handling.
 */
class QuestionnaireController {
	private readonly service: QuestionnaireService;
	private readonly logger: PortalService['logger'];

	/**
	 * Creates a new QuestionnaireController instance
	 *
	 * @param {QuestionnaireService} service - Service for questionnaire operations
	 * @param {PortalService['logger']} logger - Logger for request tracking
	 */
	constructor(service: QuestionnaireService, logger: PortalService['logger']) {
		this.service = service;
		this.logger = logger;
	}

	/**
	 * Handles questionnaire start page requests
	 *
	 * Renders the questionnaire landing page where users begin
	 * the form completion process.
	 *
	 * @param {Request} req - Express request object
	 * @param {Response} res - Express response object
	 */
	startJourney = (req: Request, res: Response) => {
		this.logger.info('Displaying questionnaire start page');
		res.render(QUESTIONNAIRE_CONFIG.templates.start, {
			pageTitle: 'Local Plans Questionnaire'
		});
	};

	/**
	 * Handles questionnaire success page requests
	 *
	 * Validates session state and displays success confirmation
	 * or redirects to appropriate page based on submission status.
	 *
	 * @param {Request} req - Express request object
	 * @param {Response} res - Express response object
	 */
	viewSuccessPage = (req: Request, res: Response) => {
		const session = SessionManager.get(req);
		this.logger.info(`Success page request - reference: ${session.reference}, submitted: ${session.submitted}`);

		if (session.error) return this.handleSessionError(req, res, session.error);
		if (!session.submitted || !session.reference) return this.handleMissingSession(res);

		return this.renderSuccessPage(req, res, session.reference);
	};

	/**
	 * Handles session errors by clearing session and redirecting
	 *
	 * @param {Request} req - Express request object
	 * @param {Response} res - Express response object
	 * @param {string} error - Error message from session
	 * @returns {Response} Redirect response
	 * @private
	 */
	private handleSessionError(req: Request, res: Response, error: string) {
		this.logger.warn(`Session error: ${error}, redirecting to check answers`);
		SessionManager.clear(req);
		return res.redirect('/questionnaire/check-your-answers');
	}

	/**
	 * Handles missing session data by redirecting to start
	 *
	 * @param {Response} res - Express response object
	 * @returns {Response} Redirect response
	 * @private
	 */
	private handleMissingSession(res: Response) {
		this.logger.warn('No submission data found, redirecting to start');
		return res.redirect('/questionnaire');
	}

	/**
	 * Renders the success page with submission reference
	 *
	 * @param {Request} req - Express request object
	 * @param {Response} res - Express response object
	 * @param {string} reference - Submission reference number
	 * @private
	 */
	private renderSuccessPage(req: Request, res: Response, reference: string) {
		this.logger.info(`Rendering success page with reference: ${reference}`);
		SessionManager.clear(req);
		res.render(QUESTIONNAIRE_CONFIG.templates.success, {
			pageTitle: 'Questionnaire submitted successfully',
			reference
		});
	}
}

/**
 * Factory function that creates questionnaire controllers
 *
 * Sets up the questionnaire service with repository and creates
 * controller instances with proper dependency injection.
 *
 * @param {PortalService} portalService - Portal service for dependency injection
 * @returns {Object} Object containing controller methods and service instance
 *
 * @example
 * ```typescript
 * const controllers = createQuestionnaireControllers(portalService);
 * router.get('/', controllers.startJourney);
 * router.get('/success', controllers.viewSuccessPage);
 * ```
 */
export const createQuestionnaireControllers = (portalService: PortalService) => {
	const repository = new PrismaQuestionnaireRepository(portalService.db, portalService.logger);
	const questionnaireService = new QuestionnaireService(portalService.logger, repository);
	const controller = new QuestionnaireController(questionnaireService, portalService.logger);

	return {
		startJourney: controller.startJourney,
		viewSuccessPage: controller.viewSuccessPage,
		questionnaireService
	};
};
