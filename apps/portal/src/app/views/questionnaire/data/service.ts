import type { Logger } from 'pino';
import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import type { QuestionnaireAnswers } from './types.ts';

/**
 * Questionnaire-specific data service layer
 *
 * Handles questionnaire data persistence operations with proper data mapping
 * between form fields and database schema. Manages questionnaire business logic
 * and data operations with clear separation of concerns.
 *
 * @example
 * ```typescript
 * const dataService = new QuestionnaireService(databaseService, logger);
 * const result = await dataService.saveSubmission(answers);
 * ```
 */
export class QuestionnaireService {
	/** Prisma client for database operations */
	private readonly prisma: PrismaClient;
	/** Logger instance for operation tracking */
	private readonly logger: Logger;

	/**
	 * Creates a new QuestionnaireService instance
	 *
	 * @param {PrismaClient} prisma - Prisma client for database operations
	 * @param {Logger} logger - Logger for tracking data operations
	 */
	constructor(prisma: PrismaClient, logger: Logger) {
		this.prisma = prisma;
		this.logger = logger;
	}

	/**
	 * Saves questionnaire submission to the database
	 *
	 * Maps form data to database schema, handling optional fields appropriately.
	 * Returns the creation result with generated ID and timestamp.
	 *
	 * @param {QuestionnaireAnswers} answers - User's questionnaire responses
	 * @returns {Promise<{id: string, createdAt: Date}>} Promise resolving to creation result with id and timestamp
	 *
	 * @example
	 * ```typescript
	 * const answers = { fullName: 'John Doe', email: 'john@example.com', rating: 'good', feedback: 'Great service!' };
	 * const result = await dataService.saveSubmission(answers);
	 * console.log(`Saved with ID: ${result.id}`);
	 * ```
	 */
	async saveSubmission(answers: QuestionnaireAnswers): Promise<{ id: string; createdAt: Date }> {
		// Map form data to database schema
		const dbData = {
			fullName: answers.fullName,
			email: answers.email || null, // Handle optional email
			rating: answers.rating,
			feedback: answers.feedback
		};
		const result = await this.prisma.questionnaire.create({
			data: dbData,
			select: { id: true, createdAt: true }
		});
		this.logger.info(`Created questionnaire - id: ${result.id}`);
		return result;
	}

	/**
	 * Gets total count of active questionnaire submissions
	 *
	 * Returns count of non-deleted submissions for statistics and reporting.
	 * Used across portal and manage apps for displaying submission metrics.
	 *
	 * @returns {Promise<number>} Promise resolving to count of active submissions
	 *
	 * @example
	 * ```typescript
	 * const count = await dataService.getTotalSubmissions();
	 * console.log(`Total submissions: ${count}`);
	 * ```
	 */
	async getTotalSubmissions(): Promise<number> {
		const count = await this.prisma.questionnaire.count({ where: { isDeleted: false } });
		this.logger.debug(`Questionnaire count: ${count}`);
		return count;
	}
}
