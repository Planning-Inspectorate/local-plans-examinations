import type { Logger } from 'pino';
import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import { QUESTIONNAIRE_CONFIG } from '../core/config.ts';

/**
 * Data access service for questionnaire operations in manage app
 *
 * Handles database queries for questionnaire submissions using Prisma.
 * Filters out deleted submissions and logs query operations.
 */
export class QuestionnaireService {
	private readonly prisma: PrismaClient;
	private readonly logger: Logger;

	/**
	 * Creates data service for questionnaire database operations
	 *
	 * @param {PrismaClient} prisma - Database client for queries
	 * @param {Logger} logger - Logger for query tracking
	 */
	constructor(prisma: PrismaClient, logger: Logger) {
		this.prisma = prisma;
		this.logger = logger;
	}

	/**
	 * Counts active questionnaire submissions for dashboard statistics
	 *
	 * @returns {Promise<number>} Count of non-deleted submissions
	 */
	async getTotalSubmissions(): Promise<number> {
		const count = await this.prisma.questionnaire.count({ where: QUESTIONNAIRE_CONFIG.filters.active });
		this.logger.debug(`Database query: questionnaire count = ${count}`);
		return count;
	}

	/**
	 * Retrieves all active questionnaire submissions for list display
	 *
	 * @returns {Promise<Array>} All non-deleted submissions with user data
	 */
	async getAllSubmissions(): Promise<Array<any>> {
		const submissions = await this.prisma.questionnaire.findMany({ where: QUESTIONNAIRE_CONFIG.filters.active });
		this.logger.debug(`Database query: retrieved ${submissions.length} questionnaire submissions`);
		return submissions;
	}

	/**
	 * Finds specific questionnaire submission by ID for detail view
	 *
	 * @param {string} id - Unique submission identifier
	 * @returns {Promise<any>} Submission record or null if not found
	 */
	async getSubmissionById(id: string): Promise<any> {
		const submission = await this.prisma.questionnaire.findUnique({ where: { id } });
		this.logger.debug(`Database query: retrieved questionnaire submission ${id}`);
		return submission;
	}
}
