import type { Logger } from 'pino';
import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import type { QuestionnaireAnswers } from './types.ts';

// Data layer for questionnaire persistence with form-to-database mapping
export class QuestionnaireService {
	private readonly prisma: PrismaClient;
	private readonly logger: Logger;
	constructor(prisma: PrismaClient, logger: Logger) {
		this.prisma = prisma;
		this.logger = logger;
	}

	// Maps form data to database schema, handling optional email field
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

	// Returns count excluding soft-deleted records for statistics
	async getTotalSubmissions(): Promise<number> {
		const count = await this.prisma.questionnaire.count({ where: { isDeleted: false } });
		this.logger.debug(`Questionnaire count: ${count}`);
		return count;
	}
}
