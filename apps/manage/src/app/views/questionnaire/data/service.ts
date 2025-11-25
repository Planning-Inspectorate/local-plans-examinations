import type { Logger } from 'pino';
import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import { QUESTIONNAIRE_CONFIG } from '../core/config.ts';

/**
 * Data service for questionnaire operations in manage app
 *
 * Handles database operations for questionnaire statistics using Prisma client.
 * Provides data layer for questionnaire queries with proper filtering.
 */
export class QuestionnaireService {
	private readonly db: PrismaClient;
	private readonly logger: Logger;

	/**
	 * Creates questionnaire data service instance
	 *
	 * @param {PrismaClient} db - Prisma database client
	 * @param {Logger} logger - Logger instance
	 */
	constructor(db: PrismaClient, logger: Logger) {
		this.db = db;
		this.logger = logger;
	}

	/**
	 * Gets total count of questionnaire submissions
	 *
	 * @returns {Promise<number>} Total submission count
	 */
	async getTotalSubmissions(): Promise<number> {
		const count = await this.db.questionnaire.count({
			where: QUESTIONNAIRE_CONFIG.filters.active
		});
		this.logger.debug(`Database query: questionnaire count = ${count}`);
		return count;
	}

	/**
	 * Gets all questionnaire submissions
	 *
	 * @returns {Promise<Array>} All questionnaire submissions
	 */
	async getAllSubmissions(): Promise<Array<any>> {
		const submissions = await this.db.questionnaire.findMany({
			where: QUESTIONNAIRE_CONFIG.filters.active
		});
		this.logger.debug(`Database query: retrieved ${submissions.length} questionnaire submissions`);
		return submissions;
	}

	/**
	 * Gets a single questionnaire submission by ID
	 *
	 * @param {string} id - Submission ID
	 * @returns {Promise<any>} Single questionnaire submission
	 */
	async getSubmissionById(id: string): Promise<any> {
		const submission = await this.db.questionnaire.findUnique({
			where: { id }
		});
		this.logger.debug(`Database query: retrieved questionnaire submission ${id}`);
		return submission;
	}
}
