import type { Logger } from 'pino';
import type { DatabaseService, CreateResult } from '@pins/local-plans-lib/database';
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
	/** Database adapter for questionnaire operations */
	private readonly repository;
	/** Logger instance for operation tracking */
	private readonly logger: Logger;

	/**
	 * Creates a new QuestionnaireService instance
	 *
	 * @param {DatabaseService} databaseService - Database service factory for creating adapters
	 * @param {Logger} logger - Logger for tracking data operations
	 */
	constructor(databaseService: DatabaseService, logger: Logger) {
		this.repository = databaseService.createAdapter<QuestionnaireAnswers>('questionnaire');
		this.logger = logger;
	}

	/**
	 * Saves questionnaire submission to the database
	 *
	 * Maps form data to database schema, handling optional fields appropriately.
	 * Returns the creation result with generated ID and timestamp.
	 *
	 * @param {QuestionnaireAnswers} answers - User's questionnaire responses
	 * @returns {Promise<CreateResult>} Promise resolving to creation result with id and timestamp
	 *
	 * @example
	 * ```typescript
	 * const answers = { fullName: 'John Doe', email: 'john@example.com', rating: 'good', feedback: 'Great service!' };
	 * const result = await dataService.saveSubmission(answers);
	 * console.log(`Saved with ID: ${result.id}`);
	 * ```
	 */
	async saveSubmission(answers: QuestionnaireAnswers): Promise<CreateResult> {
		// Map form data to database schema
		const dbData = {
			fullName: answers.fullName,
			email: answers.email || null, // Handle optional email
			rating: answers.rating,
			feedback: answers.feedback
		};
		return this.repository.create(dbData as any);
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
		return this.repository.count({ isDeleted: false });
	}
}
