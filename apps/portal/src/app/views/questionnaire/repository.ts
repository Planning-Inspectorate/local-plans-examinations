import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import type { Logger } from 'pino';
import type { QuestionnaireAnswers } from './types/types.ts';

export class PrismaQuestionnaireRepository {
	private readonly db: PrismaClient;
	private readonly logger: Logger;

	constructor(db: PrismaClient, logger: Logger) {
		this.db = db;
		this.logger = logger;
	}

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
}
