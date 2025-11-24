import type { Logger } from 'pino';
import type { QuestionnaireService as QuestionnaireDataService } from '../data/service.ts';

/**
 * Service class for handling questionnaire business logic in manage app
 *
 * Orchestrates questionnaire statistics operations for internal staff.
 * Acts as the business logic layer coordinating between controllers and data services.
 * Follows SOLID principles with single responsibility for questionnaire statistics.
 */
export class QuestionnaireService {
	private readonly logger: Logger;
	private readonly dataService: QuestionnaireDataService;

	/**
	 * Creates a new QuestionnaireService instance
	 *
	 * @param {Logger} logger - Pino logger instance for service operation tracking
	 * @param {QuestionnaireDataService} dataService - Data service for database operations
	 */
	constructor(logger: Logger, dataService: QuestionnaireDataService) {
		this.logger = logger;
		this.dataService = dataService;
	}

	/**
	 * Gets total count of questionnaire submissions
	 *
	 * @returns {Promise<number>} Total number of questionnaire submissions
	 */
	async getTotalSubmissions(): Promise<number> {
		const count = await this.dataService.getTotalSubmissions();
		this.logger.info(`Retrieved total questionnaire submissions: ${count}`);
		return count;
	}

	/**
	 * Gets all questionnaire submissions
	 *
	 * @returns {Promise<Array>} All questionnaire submissions
	 */
	async getAllSubmissions(): Promise<Array<any>> {
		const submissions = await this.dataService.getAllSubmissions();
		this.logger.info(`Retrieved ${submissions.length} questionnaire submissions`);
		return submissions;
	}

	/**
	 * Gets a single questionnaire submission by ID
	 *
	 * @param {string} id - Submission ID
	 * @returns {Promise<any>} Single questionnaire submission
	 */
	async getSubmissionById(id: string): Promise<any> {
		const submission = await this.dataService.getSubmissionById(id);
		this.logger.info(`Retrieved questionnaire submission: ${id}`);
		return submission;
	}
}
