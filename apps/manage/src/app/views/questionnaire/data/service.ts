import type { Logger } from 'pino';
import { DatabaseService } from '@pins/local-plans-lib/database';
import { QUESTIONNAIRE_CONFIG } from '../core/config.ts';

/**
 * Data service for questionnaire operations in manage app
 *
 * Handles database operations for questionnaire statistics.
 * Provides data layer abstraction for questionnaire queries.
 */
export class QuestionnaireService {
	private readonly repository;
	private readonly logger: Logger;

	/**
	 * Creates questionnaire data service instance
	 *
	 * @param {DatabaseService} databaseService - Database service factory
	 * @param {Logger} logger - Logger instance
	 */
	constructor(databaseService: DatabaseService, logger: Logger) {
		this.repository = databaseService.createAdapter('questionnaire');
		this.logger = logger;
	}

	/**
	 * Gets total count of questionnaire submissions
	 *
	 * @returns {Promise<number>} Total submission count
	 */
	async getTotalSubmissions(): Promise<number> {
		const count = await this.repository.count(QUESTIONNAIRE_CONFIG.filters.active);
		this.logger.debug(`Database query: questionnaire count = ${count}`);
		return count;
	}

	/**
	 * Gets all questionnaire submissions
	 *
	 * @returns {Promise<Array>} All questionnaire submissions
	 */
	async getAllSubmissions(): Promise<Array<any>> {
		if (!this.repository.findMany) {
			throw new Error('findMany method not available on repository');
		}
		const submissions = await this.repository.findMany(QUESTIONNAIRE_CONFIG.filters.active);
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
		if (!this.repository.findById) {
			throw new Error('findById method not available on repository');
		}
		const submission = await this.repository.findById(id);
		this.logger.debug(`Database query: retrieved questionnaire submission ${id}`);
		return submission;
	}
}
