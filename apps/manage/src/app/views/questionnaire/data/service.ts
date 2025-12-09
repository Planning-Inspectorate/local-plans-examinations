import type { Logger } from 'pino';
import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import type { QuestionnaireSubmission } from '../types.ts';
import type { QuestionnaireDataService } from '../core/types.ts';

/**
 * Retrieves the total count of active questionnaire submissions.
 *
 * @param prisma - Prisma database client
 * @param logger - Logger instance for recording operations
 * @returns Promise resolving to total submission count
 */
const getTotalSubmissions = async (prisma: PrismaClient, logger: Logger): Promise<number> => {
	const count = await prisma.questionnaire.count({
		where: { isDeleted: false }
	});
	logger.debug(`Database query: questionnaire count = ${count}`);
	return count;
};

/**
 * Retrieves all active questionnaire submissions.
 *
 * @param prisma - Prisma database client
 * @param logger - Logger instance for recording operations
 * @returns Promise resolving to array of submissions
 */
const getAllSubmissions = async (prisma: PrismaClient, logger: Logger): Promise<QuestionnaireSubmission[]> => {
	const submissions = await prisma.questionnaire.findMany({
		where: { isDeleted: false },
		orderBy: { createdAt: 'desc' }
	});
	logger.debug(`Database query: retrieved ${submissions.length} questionnaire submissions`);
	return submissions;
};

/**
 * Retrieves a specific questionnaire submission by ID.
 *
 * @param prisma - Prisma database client
 * @param logger - Logger instance for recording operations
 * @param id - Unique identifier for the submission
 * @returns Promise resolving to submission or null if not found
 */
const getSubmissionById = async (
	prisma: PrismaClient,
	logger: Logger,
	id: string
): Promise<QuestionnaireSubmission | null> => {
	const submission = await prisma.questionnaire.findUnique({
		where: { id, isDeleted: false }
	});
	logger.debug(`Database query: retrieved questionnaire submission ${id}`);
	return submission;
};

/**
 * Soft deletes a questionnaire submission by marking it as deleted.
 *
 * @param prisma - Prisma database client
 * @param logger - Logger instance for recording operations
 * @param id - Unique identifier for the submission to delete
 * @returns Promise that resolves when deletion is complete
 */
const deleteSubmission = async (prisma: PrismaClient, logger: Logger, id: string): Promise<void> => {
	await prisma.questionnaire.update({
		where: { id },
		data: { isDeleted: true }
	});
	logger.info(`Soft deleted questionnaire submission: ${id}`);
};

/**
 * Factory function that creates the questionnaire data service.
 * Provides data layer operations for questionnaire management with proper error handling.
 *
 * @param prisma - Prisma database client for data operations
 * @param logger - Logger instance for recording database operations
 * @returns Data service object with database operation methods
 */
export const createQuestionnaireDataService = (prisma: PrismaClient, logger: Logger): QuestionnaireDataService => ({
	getTotalSubmissions: () => getTotalSubmissions(prisma, logger),
	getAllSubmissions: () => getAllSubmissions(prisma, logger),
	getSubmissionById: (id: string) => getSubmissionById(prisma, logger, id),
	deleteSubmission: (id: string) => deleteSubmission(prisma, logger, id)
});
