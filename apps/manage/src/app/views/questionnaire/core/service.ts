import type { Logger } from 'pino';
import type { QuestionnaireService as QuestionnaireDataService } from '../data/service.ts';

/**
 * Business logic service for questionnaire operations in manage app
 *
 * Handles questionnaire statistics and data retrieval for internal staff.
 * Coordinates between controllers and data services with logging.
 */
export class QuestionnaireService {
	private readonly logger: Logger;
	private readonly dataService: QuestionnaireDataService;

	/**
	 * Creates questionnaire service for manage app operations
	 *
	 * @param {Logger} logger - Logger for tracking operations
	 * @param {QuestionnaireDataService} dataService - Data service for database access
	 */
	constructor(logger: Logger, dataService: QuestionnaireDataService) {
		this.logger = logger;
		this.dataService = dataService;
	}

	/**
	 * Gets total count of questionnaire submissions for dashboard display
	 *
	 * @returns {Promise<number>} Total submission count
	 */
	async getTotalSubmissions(): Promise<number> {
		const count = await this.dataService.getTotalSubmissions();
		this.logger.info(`Retrieved total questionnaire submissions: ${count}`);
		return count;
	}

	/**
	 * Gets all questionnaire submissions for list page display
	 *
	 * @returns {Promise<Array>} All submissions with user data
	 */
	async getAllSubmissions(): Promise<Array<any>> {
		const submissions = await this.dataService.getAllSubmissions();
		this.logger.info(`Retrieved ${submissions.length} questionnaire submissions`);
		return submissions;
	}

	/**
	 * Gets individual questionnaire submission for detail page
	 *
	 * @param {string} id - Submission ID
	 * @returns {Promise<any>} Submission details or null if not found
	 */
	async getSubmissionById(id: string): Promise<any> {
		const submission = await this.dataService.getSubmissionById(id);
		this.logger.info(`Retrieved questionnaire submission: ${id}`);
		return submission;
	}
}
