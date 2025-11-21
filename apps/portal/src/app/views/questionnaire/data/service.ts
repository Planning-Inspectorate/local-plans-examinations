import type { Logger } from 'pino';
import type { DatabaseService } from '@pins/local-plans-lib/database';
import type { QuestionnaireAnswers } from './types.ts';

/**
 * Questionnaire-specific service layer
 * SOLID: Single Responsibility - handles questionnaire business logic
 */
export class QuestionnaireService {
	private readonly repository;
	private readonly logger: Logger;

	constructor(databaseService: DatabaseService, logger: Logger) {
		this.repository = databaseService.createAdapter<QuestionnaireAnswers>('questionnaire');
		this.logger = logger;
	}

	async saveSubmission(answers: QuestionnaireAnswers) {
		// Map form data to database schema
		const dbData = {
			fullName: answers.fullName,
			email: answers.email || null, // Handle optional email
			rating: answers.rating,
			feedback: answers.feedback
		};
		return this.repository.create(dbData);
	}

	async getTotalSubmissions(): Promise<number> {
		return this.repository.count({ isDeleted: false });
	}
}
