import type { Request, Response } from 'express';
import { clearDataFromSession } from '@planning-inspectorate/dynamic-forms/src/lib/session-answer-store.js';
import { QuestionnaireService, SessionManager } from './core/service.ts';
import { QUESTIONNAIRE_CONFIG } from './core/config.ts';
import type { QuestionnaireAnswers } from './types/types.ts';
import type { PortalService } from '#service';

/**
 * Controller class for handling questionnaire form submission
 *
 * Orchestrates the final submission process including request validation,
 * data persistence, notification sending, session management, and graceful
 * error handling. Implements comprehensive error recovery and user feedback.
 *
 * @example
 * ```typescript
 * const controller = new SaveController(service, logger);
 * router.post('/check-your-answers', asyncHandler(controller.handle));
 * ```
 */
class SaveController {
	private readonly service: QuestionnaireService;
	private readonly logger: PortalService['logger'];

	/**
	 * Creates a new SaveController instance
	 *
	 * Initializes the controller with required dependencies for handling
	 * questionnaire submission requests and managing the complete save process.
	 *
	 * @param {QuestionnaireService} service - Service instance for questionnaire business logic operations
	 * @param {PortalService['logger']} logger - Pino logger instance for request tracking and error logging
	 */
	constructor(service: QuestionnaireService, logger: PortalService['logger']) {
		this.service = service;
		this.logger = logger;
	}

	/**
	 * Main handler for questionnaire submission requests
	 *
	 * Orchestrates the complete submission process including data extraction,
	 * validation, database persistence, notification sending, session management,
	 * and error handling with appropriate user feedback and recovery.
	 *
	 * @param {Request} req - Express request object containing session and form data
	 * @param {Response} res - Express response object with journey data in locals
	 * @returns {Promise<void>} Promise that resolves after processing submission
	 *
	 * @example
	 * ```typescript
	 * // Route handler
	 * router.post('/check-your-answers', asyncHandler(saveController.handle));
	 * ```
	 */
	handle = async (req: Request, res: Response) => {
		try {
			const { answers, journey } = this.extractRequestData(res);
			const validation = this.validateRequest(answers, journey);

			if (!validation.isValid) {
				return this.handleValidationError(res, validation.redirectTo, validation.message);
			}

			await this.processSubmission(req, res, answers!);
		} catch (error) {
			this.handleSubmissionError(req, res, error);
		}
	};

	/**
	 * Extracts questionnaire data from response locals
	 *
	 * Retrieves user answers and journey state from Express response locals
	 * where dynamic forms middleware stores the processed form data.
	 *
	 * @param {Response} res - Express response object containing journey data in locals
	 * @returns {Object} Extracted data object
	 * @returns {QuestionnaireAnswers} returns.answers - User's form responses
	 * @returns {any} returns.journey - Dynamic forms journey instance
	 * @private
	 */
	private extractRequestData(res: Response) {
		return {
			answers: res.locals.journeyResponse?.answers as QuestionnaireAnswers,
			journey: res.locals.journey
		};
	}

	/**
	 * Validates questionnaire submission requirements
	 *
	 * Checks that the journey is complete and answers are present before
	 * allowing submission to proceed. Provides appropriate redirect targets
	 * for different failure scenarios.
	 *
	 * @param {QuestionnaireAnswers} answers - User's questionnaire responses to validate
	 * @param {any} journey - Dynamic forms journey object with completion status
	 * @returns {Object} Validation result object
	 * @returns {boolean} returns.isValid - Whether validation passed
	 * @returns {string} [returns.redirectTo] - URL to redirect to if validation failed
	 * @returns {string} [returns.message] - Error message for logging if validation failed
	 * @private
	 */
	private validateRequest(answers: QuestionnaireAnswers, journey: any) {
		if (!journey?.isComplete()) {
			return { isValid: false, redirectTo: '/questionnaire/check-your-answers', message: 'Journey not complete' };
		}
		if (!answers || Object.keys(answers).length === 0) {
			return { isValid: false, redirectTo: '/questionnaire', message: 'No answers found' };
		}
		return { isValid: true };
	}

	/**
	 * Handles validation errors by logging and redirecting
	 *
	 * Logs validation failure details and redirects user to appropriate
	 * page to recover from the error state.
	 *
	 * @param {Response} res - Express response object for sending redirect
	 * @param {string} redirectTo - Target URL for user recovery
	 * @param {string} message - Descriptive error message for logging
	 * @returns {Response} Express redirect response
	 * @private
	 */
	private handleValidationError(res: Response, redirectTo: string, message: string) {
		this.logger.warn(`${message}, redirecting to ${redirectTo}`);
		return res.redirect(redirectTo);
	}

	/**
	 * Processes valid questionnaire submission
	 *
	 * Executes the complete submission workflow: saves data to database,
	 * sends notifications, stores success state in session, clears form data,
	 * and redirects user to success confirmation page.
	 *
	 * @param {Request} req - Express request object containing user session
	 * @param {Response} res - Express response object for redirect
	 * @param {QuestionnaireAnswers} answers - Validated questionnaire responses ready for persistence
	 * @returns {Promise<void>} Promise that resolves after successful processing
	 * @private
	 */
	private async processSubmission(req: Request, res: Response, answers: QuestionnaireAnswers) {
		this.logger.info('Processing questionnaire submission');
		const submission = await this.service.saveSubmission(answers);
		await this.service.sendNotification(submission);

		SessionManager.store(req, submission);
		clearDataFromSession({ req, journeyId: QUESTIONNAIRE_CONFIG.id });

		this.logger.info('Questionnaire saved successfully');
		res.redirect('/questionnaire/success');
	}

	/**
	 * Handles submission errors gracefully
	 *
	 * Provides comprehensive error handling by logging error details,
	 * storing user-friendly error message in session for display,
	 * and redirecting back to check answers page for recovery.
	 *
	 * @param {Request} req - Express request object containing user session
	 * @param {Response} res - Express response object for redirect
	 * @param {unknown} error - Error that occurred during submission process
	 * @private
	 */
	private handleSubmissionError(req: Request, res: Response, error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		this.logger.error(`Submission error: ${message}`);
		SessionManager.setError(req, 'There was a problem submitting your questionnaire. Please try again.');
		res.redirect('/questionnaire/check-your-answers');
	}
}

/**
 * Factory function that creates a questionnaire save controller
 *
 * Creates and configures a save controller instance with proper dependency
 * injection, returning the bound handler method ready for Express routing.
 *
 * @param {QuestionnaireService} service - Questionnaire service instance for business logic
 * @param {PortalService} portalService - Portal service containing logger and other dependencies
 * @returns {Function} Express async request handler for questionnaire submission processing
 *
 * @example
 * ```typescript
 * const saveHandler = createSaveController(questionnaireService, portalService);
 * router.post('/check-your-answers', asyncHandler(saveHandler));
 *
 * // Handler processes: validation → save → notify → redirect
 * ```
 */
export const createSaveController = (service: QuestionnaireService, portalService: PortalService) => {
	const controller = new SaveController(service, portalService.logger);
	return controller.handle;
};
