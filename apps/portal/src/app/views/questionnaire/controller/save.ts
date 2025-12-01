import type { Request, Response } from 'express';
import { clearDataFromSession } from '@planning-inspectorate/dynamic-forms/src/lib/session-answer-store.js';
import { SessionManager, JOURNEY_ID } from '../core/index.ts';
import type { PortalService } from '#service';
import type { QuestionnaireAnswers, QuestionnaireSubmission } from '../core/service.ts';

/**
 * Extracts form data and journey information from the response locals.
 * This data is populated by the dynamic forms middleware.
 *
 * @param res - Express response object containing journey data in locals
 * @returns Object containing answers and journey information
 */
const extractRequestData = (res: Response) => ({
	answers: res.locals.journeyResponse?.answers as QuestionnaireAnswers | undefined,
	journey: res.locals.journey
});

/**
 * Validates that the questionnaire journey is complete and contains answers.
 * Ensures all required data is present before allowing submission.
 *
 * @param answers - Form answers from the user
 * @param journey - Journey object containing completion status
 * @returns Validation result with isValid flag and redirect information
 */
const validateRequest = (answers: QuestionnaireAnswers | undefined, journey: { isComplete(): boolean } | undefined) => {
	if (!journey?.isComplete()) {
		return {
			isValid: false,
			redirectTo: '/questionnaire/check-your-answers',
			message: 'Journey not complete'
		};
	}
	if (!answers || Object.keys(answers).length === 0) {
		return {
			isValid: false,
			redirectTo: '/questionnaire',
			message: 'No answers found'
		};
	}
	return { isValid: true };
};

/**
 * Handles validation errors by logging the issue and redirecting the user.
 *
 * @param res - Express response object
 * @param redirectTo - URL to redirect the user to
 * @param message - Error message to log
 * @param logger - Logger instance
 * @returns Redirect response
 */
const handleValidationError = (res: Response, redirectTo: string, message: string, logger: PortalService['logger']) => {
	logger.warn(`${message}, redirecting to ${redirectTo}`);
	return res.redirect(redirectTo);
};

const processSubmission = async (
	req: Request,
	res: Response,
	answers: QuestionnaireAnswers,
	service: {
		saveSubmission(answers: QuestionnaireAnswers): Promise<QuestionnaireSubmission>;
		sendNotification(submission: QuestionnaireSubmission): Promise<void>;
	},
	logger: PortalService['logger']
) => {
	logger.info('Processing questionnaire submission');
	const submission = await service.saveSubmission(answers);
	await service.sendNotification(submission);

	SessionManager.store(req, submission);
	clearDataFromSession({ req, journeyId: JOURNEY_ID });

	logger.info('Questionnaire saved successfully');
	res.redirect('/questionnaire/success');
};

/**
 * Handles submission errors by logging the error and redirecting with user-friendly message.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param error - The error that occurred during submission
 * @param logger - Logger instance
 */
const handleSubmissionError = (req: Request, res: Response, error: unknown, logger: PortalService['logger']) => {
	const message = error instanceof Error ? error.message : String(error);
	logger.error(`Submission error: ${message}`);
	SessionManager.setError(req, 'There was a problem submitting your questionnaire. Please try again.');
	res.redirect('/questionnaire/check-your-answers');
};

/**
 * Creates the main submission handler that orchestrates the complete submission workflow.
 * Validates → saves → notifies → redirects with comprehensive error handling.
 *
 * @param service - Questionnaire service for data operations
 * @param logger - Logger instance
 * @returns Express route handler function
 */
const handleSave =
	(
		service: {
			saveSubmission(answers: QuestionnaireAnswers): Promise<QuestionnaireSubmission>;
			sendNotification(submission: QuestionnaireSubmission): Promise<void>;
		},
		logger: PortalService['logger']
	) =>
	async (req: Request, res: Response) => {
		try {
			const { answers, journey } = extractRequestData(res);
			const validation = validateRequest(answers, journey);

			if (!validation.isValid) {
				return handleValidationError(res, validation.redirectTo!, validation.message!, logger);
			}

			await processSubmission(req, res, answers as QuestionnaireAnswers, service, logger);
		} catch (error) {
			handleSubmissionError(req, res, error, logger);
		}
	};

/**
 * Factory function for creating the save controller with dependency injection.
 * Configures the submission handler with the required service and logger.
 *
 * @param service - Questionnaire service instance
 * @param portalService - Portal service containing logger
 * @returns Configured save controller handler
 */
export const createSaveController = (
	service: {
		saveSubmission(answers: QuestionnaireAnswers): Promise<QuestionnaireSubmission>;
		sendNotification(submission: QuestionnaireSubmission): Promise<void>;
	},
	portalService: PortalService
) => {
	return handleSave(service, portalService.logger);
};
