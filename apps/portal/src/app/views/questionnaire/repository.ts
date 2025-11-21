import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import type { Logger } from 'pino';
import type { QuestionnaireAnswers } from './types/types.ts';

/**
 * Repository class for questionnaire data persistence using Prisma ORM
 *
 * Handles all database operations related to questionnaire submissions,
 * providing a clean interface between the service layer and database.
 */
export class PrismaQuestionnaireRepository {
	private readonly db: PrismaClient;
	private readonly logger: Logger;

	/**
	 * Creates a new PrismaQuestionnaireRepository instance
	 *
	 * @param {PrismaClient} db - Prisma database client
	 * @param {Logger} logger - Pino logger instance
	 */
	constructor(db: PrismaClient, logger: Logger) {
		this.db = db;
		this.logger = logger;
	}

	/**
	 * Saves questionnaire answers to the database
	 *
	 * Creates a new questionnaire record with the provided answers,
	 * automatically generating ID and timestamps.
	 *
	 * @param {QuestionnaireAnswers} data - User's questionnaire responses
	 * @returns {Promise<{id: string, createdAt: Date}>} Database result with generated ID and timestamp
	 *
	 * @example
	 * ```typescript
	 * const result = await repository.save({
	 *   fullName: 'John Doe',
	 *   email: 'john@example.com',
	 *   rating: 'excellent',
	 *   feedback: 'Great service!'
	 * });
	 * console.log(result.id); // Generated CUID
	 * ```
	 */
	async save(data: QuestionnaireAnswers): Promise<{ id: string; createdAt: Date }> {
		const result = await this.db.questionnaire.create({
			data: {
				fullName: data.fullName,
				email: data.email,
				rating: data.rating,
				feedback: data.feedback
			},
			select: {
				id: true,
				createdAt: true
			}
		});
		this.logger.info(`Questionnaire saved to database - id: ${result.id}`);
		return result;
	}

	/**
	 * Counts total number of questionnaire submissions
	 *
	 * @returns {Promise<number>} Total count of questionnaire submissions
	 *
	 * @example
	 * ```typescript
	 * const totalSubmissions = await repository.count();
	 * console.log(`Total submissions: ${totalSubmissions}`);
	 * ```
	 */
	async count(): Promise<number> {
		const count = await this.db.questionnaire.count({
			where: {
				isDeleted: false // Only count non-deleted submissions
			}
		});
		this.logger.debug(`Questionnaire count query returned: ${count}`);
		return count;
	}
}
