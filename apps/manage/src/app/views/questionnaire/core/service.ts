import type { Logger } from 'pino';
import type { QuestionnaireSubmission } from '../types.ts';
import type { QuestionnaireDataService, QuestionnaireBusinessService } from './types.ts';

/**
 * Retrieves the total count of questionnaire submissions with business logic validation.
 *
 * @param dataService - Data service for database operations
 * @param logger - Logger instance
 * @returns Promise resolving to total submission count
 */
const getTotalSubmissions = async (dataService: QuestionnaireDataService, logger: Logger): Promise<number> => {
	const count = await dataService.getTotalSubmissions();
	logger.info(`Retrieved total questionnaire submissions: ${count}`);
	return count;
};

/**
 * Retrieves all questionnaire submissions with business logic processing.
 *
 * @param dataService - Data service for database operations
 * @param logger - Logger instance
 * @returns Promise resolving to array of submissions
 */
const getAllSubmissions = async (
	dataService: QuestionnaireDataService,
	logger: Logger
): Promise<QuestionnaireSubmission[]> => {
	const submissions = await dataService.getAllSubmissions();
	logger.info(`Retrieved ${submissions.length} questionnaire submissions`);
	return submissions;
};

/**
 * Retrieves a specific questionnaire submission with validation.
 *
 * @param dataService - Data service for database operations
 * @param logger - Logger instance
 * @param id - Unique identifier for the submission
 * @returns Promise resolving to submission or null if not found
 */
const getSubmissionById = async (
	dataService: QuestionnaireDataService,
	logger: Logger,
	id: string
): Promise<QuestionnaireSubmission | null> => {
	if (!id || typeof id !== 'string') {
		logger.warn(`Invalid submission ID provided: ${id}`);
		return null;
	}

	const submission = await dataService.getSubmissionById(id);
	logger.info(`Retrieved questionnaire submission: ${id}`);
	return submission;
};

/**
 * Deletes a questionnaire submission with business logic validation.
 *
 * @param dataService - Data service for database operations
 * @param logger - Logger instance
 * @param id - Unique identifier for the submission to delete
 * @returns Promise that resolves when deletion is complete
 */
const deleteSubmission = async (dataService: QuestionnaireDataService, logger: Logger, id: string): Promise<void> => {
	if (!id || typeof id !== 'string') {
		throw new Error('Invalid submission ID provided for deletion');
	}

	// Check if submission exists before deletion
	const submission = await dataService.getSubmissionById(id);
	if (!submission) {
		throw new Error(`Questionnaire submission not found: ${id}`);
	}

	await dataService.deleteSubmission(id);
	logger.info(`Deleted questionnaire submission: ${id}`);
};

/**
 * Factory function that creates the questionnaire business logic service.
 * Provides methods for managing questionnaire submissions with validation and logging.
 *
 * @param logger - Logger instance for recording operations
 * @param dataService - Data service for database operations
 * @returns Service object with questionnaire business logic methods
 */
export const createQuestionnaireService = (
	logger: Logger,
	dataService: QuestionnaireDataService
): QuestionnaireBusinessService => ({
	getTotalSubmissions: () => getTotalSubmissions(dataService, logger),
	getAllSubmissions: () => getAllSubmissions(dataService, logger),
	getSubmissionById: (id: string) => getSubmissionById(dataService, logger, id),
	deleteSubmission: (id: string) => deleteSubmission(dataService, logger, id)
});
