import type { PortalService } from '#service';
import type { Request, Response } from 'express';
import { QuestionnaireService, SessionManager } from './core/service.ts';
import { QUESTIONNAIRE_CONFIG } from './core/config.ts';
import { DatabaseService } from '@pins/local-plans-lib/database';
import { QuestionnaireService as QuestionnaireDataService } from './data/service.ts';

/**
 * Controller class for handling questionnaire page requests
 *
 * Manages questionnaire start page and success page functionality,
 * including session state validation and error handling. Follows MVC
 * pattern with clear separation of concerns and dependency injection.
 *
 * @example
 * ```typescript
 * const controller = new QuestionnaireController(service, logger);
 * router.get('/', controller.startJourney);
 * router.get('/success', controller.viewSuccessPage);
 * ```
 */
class QuestionnaireController {
	private readonly service: QuestionnaireService;
	private readonly logger: PortalService['logger'];

	/**
	 * Creates a new QuestionnaireController instance
	 *
	 * Initializes controller with required dependencies for handling
	 * questionnaire page requests and managing user sessions.
	 *
	 * @param {QuestionnaireService} service - Service for questionnaire business logic operations
	 * @param {PortalService['logger']} logger - Pino logger instance for request tracking and debugging
	 */
	constructor(service: QuestionnaireService, logger: PortalService['logger']) {
		this.service = service;
		this.logger = logger;
	}

	/**
	 * Handles questionnaire start page requests
	 *
	 * Renders the questionnaire landing page where users begin the form
	 * completion process. Provides entry point to the dynamic forms journey.
	 *
	 * @param {Request} req - Express request object containing user session and headers
	 * @param {Response} res - Express response object for rendering templates
	 *
	 * @example
	 * ```typescript
	 * // Route: GET /questionnaire
	 * router.get('/', controller.startJourney);
	 * ```
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
	 * Validates session state and displays success confirmation page with
	 * submission reference, or redirects to appropriate page based on
	 * submission status. Implements proper error handling for edge cases.
	 *
	 * @param {Request} req - Express request object containing user session data
	 * @param {Response} res - Express response object for rendering or redirecting
	 *
	 * @example
	 * ```typescript
	 * // Route: GET /questionnaire/success
	 * router.get('/success', controller.viewSuccessPage);
	 * ```
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
	 * Clears corrupted session data and redirects user back to check answers
	 * page to recover from error state gracefully.
	 *
	 * @param {Request} req - Express request object with session to clear
	 * @param {Response} res - Express response object for redirect
	 * @param {string} error - Error message from session for logging
	 * @returns {Response} Redirect response to check answers page
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
	 * Redirects users who access success page without completing
	 * the questionnaire back to the start page.
	 *
	 * @param {Response} res - Express response object for redirect
	 * @returns {Response} Redirect response to questionnaire start page
	 * @private
	 */
	private handleMissingSession(res: Response) {
		this.logger.warn('No submission data found, redirecting to start');
		return res.redirect('/questionnaire');
	}

	/**
	 * Renders the success page with submission reference
	 *
	 * Displays the success confirmation page with the user's submission
	 * reference number and clears session data after successful display.
	 *
	 * @param {Request} req - Express request object with session to clear
	 * @param {Response} res - Express response object for template rendering
	 * @param {string} reference - Unique submission reference number to display
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
 * Factory function that creates questionnaire controllers with dependencies
 *
 * Sets up the complete questionnaire service layer with database service,
 * data service, and business logic service, then creates controller instances
 * with proper dependency injection.
 *
 * @param {PortalService} portalService - Portal service containing database client and logger
 * @returns {Object} Object containing controller methods and service instance
 * @returns {Function} returns.startJourney - Handler for questionnaire start page
 * @returns {Function} returns.viewSuccessPage - Handler for questionnaire success page
 * @returns {QuestionnaireService} returns.questionnaireService - Service instance for business logic
 *
 * @example
 * ```typescript
 * const controllers = createQuestionnaireControllers(portalService);
 * router.get('/', controllers.startJourney);
 * router.get('/success', controllers.viewSuccessPage);
 *
 * // Access service for other operations
 * const count = await controllers.questionnaireService.getTotalSubmissions();
 * ```
 */
export const createQuestionnaireControllers = (portalService: PortalService) => {
	const databaseService = new DatabaseService(portalService.db, portalService.logger);
	const questionnaireDataService = new QuestionnaireDataService(databaseService, portalService.logger);
	const questionnaireService = new QuestionnaireService(portalService.logger, questionnaireDataService);
	const controller = new QuestionnaireController(questionnaireService, portalService.logger);

	return {
		startJourney: controller.startJourney,
		viewSuccessPage: controller.viewSuccessPage,
		questionnaireService
	};
};
