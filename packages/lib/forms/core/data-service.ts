import type { Logger } from 'pino';
import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import type { FormAnswers } from './types.ts';

/**
 * Saves form submission to the database.
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
	answers: FormAnswers
): Promise<{ id: string; createdAt: Date }> => {
	try {
		const dbData = {
			fullName: answers.fullName,
			email: answers.email || null,
			rating: answers.rating,
			feedback: answers.feedback
		};

		const result = await prisma.feedback.create({
			data: dbData,
			select: { id: true, createdAt: true }
		});

		logger.info(`Created feedback - id: ${result.id}`);
		return result;
	} catch (error) {
		logger.error(`Failed to save submission: ${error}`);
		throw new Error('Failed to save form submission');
	}
};

/**
 * Retrieves the total count of form submissions for statistics.
 * Excludes soft-deleted records from the count.
 *
 * @param prisma - Prisma database client
 * @param logger - Logger instance for recording operations
 * @returns Promise resolving to total submission count
 */
const getTotalSubmissions = async (prisma: PrismaClient, logger: Logger): Promise<number> => {
	const count = await prisma.feedback.count({
		where: { isDeleted: false }
	});
	logger.debug(`Form count: ${count}`);
	return count;
};

/**
 * Retrieves all form submissions for listing.
 * Excludes soft-deleted records.
 *
 * @param prisma - Prisma database client
 * @param logger - Logger instance for recording operations
 * @returns Promise resolving to array of submissions
 */
const getAllSubmissions = async (prisma: PrismaClient, logger: Logger) => {
	const submissions = await prisma.feedback.findMany({
		where: { isDeleted: false },
		orderBy: { createdAt: 'desc' }
	});
	logger.debug(`Retrieved ${submissions.length} form submissions`);
	return submissions;
};

/**
 * Retrieves a single form submission by ID.
 * Excludes soft-deleted records.
 *
 * @param prisma - Prisma database client
 * @param logger - Logger instance for recording operations
 * @param id - Submission ID
 * @returns Promise resolving to submission or null
 */
const getSubmissionById = async (prisma: PrismaClient, logger: Logger, id: string) => {
	const submission = await prisma.feedback.findUnique({
		where: { id, isDeleted: false }
	});
	logger.debug(`Retrieved form submission: ${id}`);
	return submission;
};

/**
 * Updates a form submission.
 *
 * @param prisma - Prisma database client
 * @param logger - Logger instance for recording operations
 * @param id - Submission ID
 * @param answers - Updated form answers
 */
const updateSubmission = async (
	prisma: PrismaClient,
	logger: Logger,
	id: string,
	answers: FormAnswers
): Promise<void> => {
	try {
		await prisma.feedback.update({
			where: { id },
			data: {
				fullName: answers.fullName,
				email: answers.email || null,
				rating: answers.rating,
				feedback: answers.feedback
			}
		});
		logger.info(`Updated form submission: ${id}`);
	} catch (error) {
		logger.error(`Failed to update submission ${id}: ${error}`);
		throw new Error('Failed to update form submission');
	}
};

/**
 * Soft deletes a form submission.
 *
 * @param prisma - Prisma database client
 * @param logger - Logger instance for recording operations
 * @param id - Submission ID
 */
const deleteSubmission = async (prisma: PrismaClient, logger: Logger, id: string): Promise<void> => {
	try {
		await prisma.feedback.update({
			where: { id },
			data: { isDeleted: true }
		});
		logger.info(`Deleted form submission: ${id}`);
	} catch (error) {
		logger.error(`Failed to delete submission ${id}: ${error}`);
		throw new Error('Failed to delete form submission');
	}
};

/**
 * Factory function that creates the form data service.
 * Provides data layer operations for form persistence with form-to-database mapping.
 *
 * @param prisma - Prisma database client for data operations
 * @param logger - Logger instance for recording database operations
 * @returns Data service object with database operation methods
 */
export const createFormDataService = (prisma: PrismaClient, logger: Logger) => ({
	saveSubmission: (answers: FormAnswers) => saveSubmission(prisma, logger, answers),
	getTotalSubmissions: () => getTotalSubmissions(prisma, logger),
	getAllSubmissions: () => getAllSubmissions(prisma, logger),
	getSubmissionById: (id: string) => getSubmissionById(prisma, logger, id),
	updateSubmission: (id: string, answers: FormAnswers) => updateSubmission(prisma, logger, id, answers),
	deleteSubmission: (id: string) => deleteSubmission(prisma, logger, id)
});
