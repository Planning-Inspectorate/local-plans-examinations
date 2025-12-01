import type { Logger } from 'pino';
import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import type { QuestionnaireAnswers } from '../core/service.ts';

/**
 * Saves questionnaire submission to the database.
 * Maps form data to database schema and handles optional email field.
 *
 * @param prisma - Prisma database client
 * @param logger - Logger instance for recording operations
 * @param answers - Form answers from the user
 * @returns Promise resolving to created record with id and timestamp
 */
const saveSubmission = async (
	prisma: PrismaClient,
	logger: Logger,
	answers: QuestionnaireAnswers
): Promise<{ id: string; createdAt: Date }> => {
	const dbData = {
		fullName: answers.fullName,
		email: answers.email || null,
		rating: answers.rating,
		feedback: answers.feedback
	};

	const result = await prisma.questionnaire.create({
		data: dbData,
		select: { id: true, createdAt: true }
	});

	logger.info(`Created questionnaire - id: ${result.id}`);
	return result;
};

/**
 * Retrieves the total count of questionnaire submissions for statistics.
 * Excludes soft-deleted records from the count.
 *
 * @param prisma - Prisma database client
 * @param logger - Logger instance for recording operations
 * @returns Promise resolving to total submission count
 */
const getTotalSubmissions = async (prisma: PrismaClient, logger: Logger): Promise<number> => {
	const count = await prisma.questionnaire.count({
		where: { isDeleted: false }
	});
	logger.debug(`Questionnaire count: ${count}`);
	return count;
};

/**
 * Factory function that creates the questionnaire data service.
 * Provides data layer operations for questionnaire persistence with form-to-database mapping.
 *
 * @param prisma - Prisma database client for data operations
 * @param logger - Logger instance for recording database operations
 * @returns Data service object with database operation methods
 */
export const createQuestionnaireDataService = (prisma: PrismaClient, logger: Logger) => ({
	saveSubmission: (answers: QuestionnaireAnswers) => saveSubmission(prisma, logger, answers),
	getTotalSubmissions: () => getTotalSubmissions(prisma, logger)
});
