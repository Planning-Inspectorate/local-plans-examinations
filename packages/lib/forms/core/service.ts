import type { Logger } from 'pino';
import type { QuestionDefinition } from '@planning-inspectorate/dynamic-forms/src/questions/create-questions.js';
import type { FormAnswers, FormSubmission, FormDbResult, FormDataService, FormBusinessService } from './types.ts';

/**
 * Type definition for form questions configuration.
 * Uses the dynamic-forms QuestionDefinition type.
 */
export type FormQuestions = Record<string, QuestionDefinition>;

/**
 * Re-export types for backward compatibility
 */
export type { FormAnswers, FormSubmission };

/**
 * Creates a submission object from database result and user answers.
 * Formats the data for consistent use across the application.
 *
 * @param result - Database result containing id and createdAt
 * @param answers - User's form answers
 * @returns Formatted submission object
 */
const createSubmission = (result: FormDbResult, answers: FormAnswers): FormSubmission => ({
	id: result.id,
	reference: result.id,
	answers,
	submittedAt: result.createdAt
});

/**
 * Saves form submission to the database and creates a formatted submission object.
 *
 * @param dataService - Data service for database operations
 * @param logger - Logger instance
 * @param answers - User's form answers to save
 * @returns Promise resolving to formatted submission object
 */
const saveSubmission = async (
	dataService: FormDataService,
	logger: Logger,
	answers: FormAnswers
): Promise<FormSubmission> => {
	const result = await dataService.saveSubmission(answers);
	const submission = createSubmission(result, answers);
	logger.info(`Form saved - ID: ${submission.id}`);
	return submission;
};

/**
 * Sends notification for form submission.
 * Currently logs the notification - TODO: Implement actual notification service.
 *
 * @param logger - Logger instance
 * @param submission - Submission object containing reference and answers
 * @returns Promise that resolves when notification is processed
 */
const sendNotification = async (logger: Logger, submission: FormSubmission): Promise<void> => {
	logger.info({ reference: submission.reference, answers: submission.answers }, 'Sending notification');
	// TODO: Implement actual notification service integration
};

/**
 * Retrieves the total count of form submissions for statistics.
 *
 * @param dataService - Data service for database operations
 * @param logger - Logger instance
 * @returns Promise resolving to total submission count
 */
const getTotalSubmissions = async (dataService: FormDataService, logger: Logger): Promise<number> => {
	const count = await dataService.getTotalSubmissions();
	logger.info(`Retrieved total form submissions: ${count}`);
	return count;
};

/**
 * Factory function that creates the form business logic service.
 * Provides methods for saving submissions, sending notifications, and retrieving statistics.
 *
 * @param logger - Logger instance for recording operations
 * @param dataService - Data service for database operations
 * @returns Service object with form business logic methods
 */
export const createFormService = (logger: Logger, dataService: FormDataService): FormBusinessService => ({
	saveSubmission: (answers: FormAnswers) => saveSubmission(dataService, logger, answers),
	sendNotification: (submission: FormSubmission) => sendNotification(logger, submission),
	getTotalSubmissions: () => getTotalSubmissions(dataService, logger),
	getAllSubmissions: () => dataService.getAllSubmissions(),
	getSubmissionById: (id: string) => dataService.getSubmissionById(id),
	updateSubmission: (id: string, answers: FormAnswers) => dataService.updateSubmission(id, answers),
	deleteSubmission: (id: string) => dataService.deleteSubmission(id)
});
