import type { Request, Response } from 'express';
import { clearDataFromSession } from '@planning-inspectorate/dynamic-forms/src/lib/session-answer-store.js';
import { QuestionnaireService, SessionManager } from './core/service.ts';
import { QUESTIONNAIRE_CONFIG } from './core/config.ts';
import type { QuestionnaireAnswers } from './types/types.ts';
import type { PortalService } from '#service';

// Handles questionnaire submission with validation and error recovery
class SaveController {
	private readonly service: QuestionnaireService;
	private readonly logger: PortalService['logger'];

	constructor(service: QuestionnaireService, logger: PortalService['logger']) {
		this.service = service;
		this.logger = logger;
	}

	// Main submission handler: validate → save → notify → redirect
	handle = async (req: Request, res: Response) => {
		try {
			const { answers, journey } = this.extractRequestData(res);
			const validation = this.validateRequest(answers, journey);

			if (!validation.isValid) {
				return this.handleValidationError(res, validation.redirectTo!, validation.message!);
			}

			await this.processSubmission(req, res, answers!);
		} catch (error) {
			this.handleSubmissionError(req, res, error);
		}
	};

	// Extracts data from dynamic forms middleware
	private extractRequestData(res: Response) {
		return {
			answers: res.locals.journeyResponse?.answers as QuestionnaireAnswers,
			journey: res.locals.journey
		};
	}

	// Ensures journey is complete and answers exist before submission
	private validateRequest(answers: QuestionnaireAnswers, journey: any) {
		if (!journey?.isComplete()) {
			return { isValid: false, redirectTo: '/questionnaire/check-your-answers', message: 'Journey not complete' };
		}
		if (!answers || Object.keys(answers).length === 0) {
			return { isValid: false, redirectTo: '/questionnaire', message: 'No answers found' };
		}
		return { isValid: true };
	}

	private handleValidationError(res: Response, redirectTo: string, message: string) {
		this.logger.warn(`${message}, redirecting to ${redirectTo}`);
		return res.redirect(redirectTo!);
	}

	// Complete workflow: save → notify → session → clear → redirect
	private async processSubmission(req: Request, res: Response, answers: QuestionnaireAnswers) {
		this.logger.info('Processing questionnaire submission');
		const submission = await this.service.saveSubmission(answers);
		await this.service.sendNotification(submission);

		SessionManager.store(req, submission);
		clearDataFromSession({ req, journeyId: QUESTIONNAIRE_CONFIG.id });

		this.logger.info('Questionnaire saved successfully');
		res.redirect('/questionnaire/success');
	}

	// Logs error and redirects with user-friendly message
	private handleSubmissionError(req: Request, res: Response, error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		this.logger.error(`Submission error: ${message}`);
		SessionManager.setError(req, 'There was a problem submitting your questionnaire. Please try again.');
		res.redirect('/questionnaire/check-your-answers');
	}
}

// Factory for creating save controller with dependency injection
export const createSaveController = (service: QuestionnaireService, portalService: PortalService) => {
	const controller = new SaveController(service, portalService.logger);
	return controller.handle;
};
