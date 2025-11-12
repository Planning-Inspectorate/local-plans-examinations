import type { Request, Response, NextFunction } from 'express';
import type { PortalService } from '#service';
import { QUESTIONNAIRE_CONFIG } from './config.ts';

// Custom error classes for questionnaire-specific errors
export class QuestionnaireError extends Error {
	public readonly code: string;
	public readonly statusCode: number;
	public readonly isOperational: boolean;

	constructor(message: string, code: string, statusCode: number = 500) {
		super(message);
		this.name = 'QuestionnaireError';
		this.code = code;
		this.statusCode = statusCode;
		this.isOperational = true;
		Error.captureStackTrace(this, this.constructor);
	}
}

export class ValidationError extends QuestionnaireError {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	constructor(message: string, field?: string) {
		super(message, 'VALIDATION_ERROR', 400);
		this.name = 'ValidationError';
	}
}

export class JourneyError extends QuestionnaireError {
	constructor(message: string) {
		super(message, 'JOURNEY_ERROR', 400);
		this.name = 'JourneyError';
	}
}

export class SessionError extends QuestionnaireError {
	constructor(message: string) {
		super(message, 'SESSION_ERROR', 500);
		this.name = 'SessionError';
	}
}

// Error handling utilities
export class QuestionnaireErrorHandler {
	private readonly logger: PortalService['logger'];

	constructor(service: PortalService) {
		this.logger = service.logger;
	}

	/**
	 * Log error with appropriate level based on error type
	 */
	logError(error: Error, context: Record<string, any> = {}): void {
		const errorInfo = {
			name: error.name,
			message: error.message,
			stack: error.stack,
			...context
		};

		if (error instanceof QuestionnaireError && error.isOperational) {
			// Operational errors are expected - log as warn
			this.logger.warn(errorInfo, 'Questionnaire operational error');
		} else {
			// Programming errors or unexpected errors - log as error
			this.logger.error(errorInfo, 'Questionnaire unexpected error');
		}
	}

	/**
	 * Handle error and render appropriate error page
	 */
	handleError(error: Error, req: Request, res: Response, context: string): void {
		this.logError(error, {
			url: req.url,
			method: req.method,
			context,
			sessionId: req.sessionID,
			userAgent: req.get('User-Agent')
		});

		// Don't expose internal errors to users
		if (error instanceof QuestionnaireError) {
			this.renderErrorPage(res, error.statusCode, error.message);
		} else {
			this.renderErrorPage(res, 500, 'An unexpected error occurred. Please try again.');
		}
	}

	/**
	 * Render error page with appropriate status code
	 */
	private renderErrorPage(res: Response, statusCode: number, message: string): void {
		res.status(statusCode).render('views/layouts/error.njk', {
			pageTitle: 'Error',
			error: {
				statusCode,
				message,
				showRetry: statusCode < 500
			}
		});
	}

	/**
	 * Create middleware for handling async errors in specific context
	 */
	createAsyncErrorHandler(context: string) {
		return (handler: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
			return async (req: Request, res: Response, next: NextFunction) => {
				try {
					await handler(req, res, next);
				} catch (error) {
					this.handleError(error as Error, req, res, context);
				}
			};
		};
	}
}

// Validation helpers
export function validateJourneySetup(req: Request): void {
	if (!req.session) {
		throw new SessionError('Session not available. Please enable cookies and try again.');
	}

	// For check-your-answers page, we can be more lenient - just check if we have answers in session
	if (req.url.includes('check-your-answers')) {
		const hasAnswers =
			req.session.forms &&
			req.session.forms[QUESTIONNAIRE_CONFIG.JOURNEY_ID] &&
			Object.keys(req.session.forms[QUESTIONNAIRE_CONFIG.JOURNEY_ID]).length > 0;

		if (!hasAnswers) {
			throw new JourneyError('No questionnaire data found. Please complete the questionnaire first.');
		}
		return; // Skip journey validation for check-your-answers
	}

	// For other pages, require journey to be properly initialized
	if (!req.journey) {
		throw new JourneyError('Journey not properly initialized. Please start the questionnaire again.');
	}
}

export function validateAnswerData(answers: any): void {
	if (!answers || typeof answers !== 'object') {
		throw new ValidationError('Invalid answer data format');
	}
}

// Safe execution wrapper
export function safeExecute<T>(
	operation: () => T,
	fallback: T,
	errorHandler: QuestionnaireErrorHandler,
	context: string
): T {
	try {
		return operation();
	} catch (error) {
		errorHandler.logError(error as Error, { context });
		return fallback;
	}
}

// Session data validation
export function validateSessionData(req: Request): void {
	if (!req.session) {
		throw new SessionError('Session not initialized');
	}

	if (!req.sessionID) {
		throw new SessionError('Session ID not available');
	}
}

// URL validation for questionnaire routes
export function validateQuestionnaireRoute(req: Request): void {
	const validSections = [
		QUESTIONNAIRE_CONFIG.SECTIONS.PERSONAL.segment,
		QUESTIONNAIRE_CONFIG.SECTIONS.EXPERIENCE.segment
	];

	if (req.params.section && !validSections.includes(req.params.section as any)) {
		throw new ValidationError(`Invalid section: ${req.params.section}`);
	}
}
