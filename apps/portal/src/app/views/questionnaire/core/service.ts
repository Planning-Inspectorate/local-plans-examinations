import type { PortalService } from '#service';
import type { Request } from 'express';

/**
 * Type definition for questionnaire form answers.
 */
export type QuestionnaireAnswers = {
	fullName: string;
	email?: string;
	wantToProvideEmail?: boolean;
	rating: string;
	feedback: string;
};

/**
 * Type definition for questionnaire questions configuration.
 */
export type QuestionnaireQuestions = Record<
	string,
	{
		type: string;
		title: string;
		question: string;
		fieldName: string;
		url: string;
		validators: unknown[];
		options?: { text: string; value: string }[];
	}
>;

/**
 * Type definition for questionnaire submission object.
 */
export type QuestionnaireSubmission = {
	id: string;
	reference: string;
	answers: QuestionnaireAnswers;
	submittedAt: Date;
};

/**
 * Type definition for session data structure used to maintain questionnaire state.
 */
type SessionData = {
	reference?: string;
	submitted?: boolean;
	error?: string;
};

/**
 * Session key used for storing questionnaire-related data in the user session.
 */
const SESSION_KEY = 'questionnaires';

/**
 * Ensures that the questionnaire session object exists in the request session.
 * Creates an empty object if it doesn't exist.
 *
 * @param req - Express request object with session
 */
const ensureSession = (req: Request): void => {
	if (!req.session[SESSION_KEY]) {
		req.session[SESSION_KEY] = {};
	}
};

/**
 * Stores submission data in the session for success page display.
 * Marks the questionnaire as submitted and saves the reference ID.
 *
 * @param req - Express request object with session
 * @param submission - Submission object containing reference and other data
 */
export const sessionStore = (req: Request, submission: { reference: string }): void => {
	ensureSession(req);
	req.session[SESSION_KEY].lastReference = submission.reference;
	req.session[SESSION_KEY].submitted = true;
};

/**
 * Retrieves questionnaire session data including submission status and reference.
 *
 * @param req - Express request object with session
 * @returns Session data object with reference, submitted status, and error
 */
export const sessionGet = (req: Request): SessionData => {
	const data = req.session[SESSION_KEY] || {};
	return {
		reference: data.lastReference,
		submitted: data.submitted,
		error: data.error
	};
};

/**
 * Clears questionnaire-related data from the session.
 * Removes submission status, reference, and any error messages.
 *
 * @param req - Express request object with session
 */
export const sessionClear = (req: Request): void => {
	if (req.session[SESSION_KEY]) {
		delete req.session[SESSION_KEY].lastReference;
		delete req.session[SESSION_KEY].submitted;
		delete req.session[SESSION_KEY].error;
	}
};

/**
 * Sets an error message in the session for display to the user.
 *
 * @param req - Express request object with session
 * @param error - Error message to store in session
 */
export const sessionSetError = (req: Request, error: string): void => {
	ensureSession(req);
	req.session[SESSION_KEY].error = error;
};

/**
 * Legacy object export providing backward compatibility with class-based interface.
 * Maintains the same API as the original SessionManager class.
 */
export const SessionManager = {
	store: sessionStore,
	get: sessionGet,
	clear: sessionClear,
	setError: sessionSetError
};

/**
 * Creates a submission object from database result and user answers.
 * Formats the data for consistent use across the application.
 *
 * @param result - Database result containing id and createdAt
 * @param answers - User's form answers
 * @returns Formatted submission object
 */
const createSubmission = (
	result: { id: string; createdAt: Date },
	answers: QuestionnaireAnswers
): QuestionnaireSubmission => ({
	id: result.id,
	reference: result.id,
	answers,
	submittedAt: result.createdAt
});

/**
 * Saves questionnaire submission to the database and creates a formatted submission object.
 *
 * @param dataService - Data service for database operations
 * @param logger - Logger instance
 * @param answers - User's form answers to save
 * @returns Promise resolving to formatted submission object
 */
const saveSubmission = async (
	dataService: { saveSubmission(answers: QuestionnaireAnswers): Promise<{ id: string; createdAt: Date }> },
	logger: PortalService['logger'],
	answers: QuestionnaireAnswers
): Promise<QuestionnaireSubmission> => {
	const result = await dataService.saveSubmission(answers);
	const submission = createSubmission(result, answers);
	logger.info(`Questionnaire saved - ID: ${submission.id}`);
	return submission;
};

/**
 * Sends notification for questionnaire submission.
 * Currently logs the notification - TODO: Implement actual notification service.
 *
 * @param logger - Logger instance
 * @param submission - Submission object containing reference and answers
 * @returns Promise that resolves when notification is processed
 */
const sendNotification = async (
	logger: PortalService['logger'],
	submission: QuestionnaireSubmission
): Promise<void> => {
	logger.info({ reference: submission.reference, email: submission.answers.email }, 'Sending notification');
	// TODO: Implement actual notification service integration
};

/**
 * Retrieves the total count of questionnaire submissions for statistics.
 *
 * @param dataService - Data service for database operations
 * @param logger - Logger instance
 * @returns Promise resolving to total submission count
 */
const getTotalSubmissions = async (
	dataService: { getTotalSubmissions(): Promise<number> },
	logger: PortalService['logger']
): Promise<number> => {
	const count = await dataService.getTotalSubmissions();
	logger.info(`Retrieved total questionnaire submissions: ${count}`);
	return count;
};

/**
 * Factory function that creates the questionnaire business logic service.
 * Provides methods for saving submissions, sending notifications, and retrieving statistics.
 *
 * @param logger - Logger instance for recording operations
 * @param dataService - Data service for database operations
 * @returns Service object with questionnaire business logic methods
 */
export const createQuestionnaireService = (
	logger: PortalService['logger'],
	dataService: {
		saveSubmission(answers: QuestionnaireAnswers): Promise<{ id: string; createdAt: Date }>;
		getTotalSubmissions(): Promise<number>;
	}
) => ({
	saveSubmission: (answers: QuestionnaireAnswers) => saveSubmission(dataService, logger, answers),
	sendNotification: (submission: QuestionnaireSubmission) => sendNotification(logger, submission),
	getTotalSubmissions: () => getTotalSubmissions(dataService, logger)
});
