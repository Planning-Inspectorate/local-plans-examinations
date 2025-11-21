import type { Request, Response } from 'express';
import { clearDataFromSession } from '@planning-inspectorate/dynamic-forms/src/lib/session-answer-store.js';
import { QuestionnaireService, SessionManager } from './core/service.ts';
import { QUESTIONNAIRE_CONFIG } from './core/config.ts';
import type { QuestionnaireAnswers } from './types/types.ts';
import type { PortalService } from '#service';

/**
 * Controller class for handling questionnaire form submission
 *
 * Manages the final submission process including validation, saving to database,
 * sending notifications, and handling errors gracefully.
 */
class SaveController {
	private readonly service: QuestionnaireService;
	private readonly logger: PortalService['logger'];

	/**
	 * Creates a new SaveController instance
	 *
	 * @param {QuestionnaireService} service - Service for questionnaire business logic
	 * @param {PortalService['logger']} logger - Logger for request tracking
	 */
	constructor(service: QuestionnaireService, logger: PortalService['logger']) {
		this.service = service;
		this.logger = logger;
	}

	/**
	 * Main handler for questionnaire submission requests
	 *
	 * Orchestrates the complete submission process including validation,
	 * saving, notification, and session management.
	 *
	 * @param {Request} req - Express request object
	 * @param {Response} res - Express response object
	 * @returns {Promise<void>}
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
	 * @param {Response} res - Express response object with locals
	 * @returns {Object} Extracted answers and journey data
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
	 * @param {QuestionnaireAnswers} answers - User's questionnaire responses
	 * @param {any} journey - Dynamic forms journey object
	 * @returns {Object} Validation result with status and redirect info
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
	 * @param {Response} res - Express response object
	 * @param {string} redirectTo - URL to redirect to
	 * @param {string} message - Error message to log
	 * @returns {Response} Redirect response
	 * @private
	 */
	private handleValidationError(res: Response, redirectTo: string, message: string) {
		this.logger.warn(`${message}, redirecting to ${redirectTo}`);
		return res.redirect(redirectTo);
	}

	/**
	 * Processes valid questionnaire submission
	 *
	 * Saves to database, sends notifications, manages session state,
	 * and redirects to success page.
	 *
	 * @param {Request} req - Express request object
	 * @param {Response} res - Express response object
	 * @param {QuestionnaireAnswers} answers - Validated questionnaire responses
	 * @returns {Promise<void>}
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
	 * Logs error details, stores error message in session,
	 * and redirects back to check answers page.
	 *
	 * @param {Request} req - Express request object
	 * @param {Response} res - Express response object
	 * @param {unknown} error - Error that occurred during submission
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
 * @param {QuestionnaireService} service - Questionnaire service instance
 * @param {PortalService} portalService - Portal service for logger access
 * @returns {Function} Express request handler for questionnaire submission
 *
 * @example
 * ```typescript
 * const saveHandler = createSaveController(questionnaireService, portalService);
 * router.post('/check-your-answers', saveHandler);
 * ```
 */
export const createSaveController = (service: QuestionnaireService, portalService: PortalService) => {
	const controller = new SaveController(service, portalService.logger);
	return controller.handle;
};
