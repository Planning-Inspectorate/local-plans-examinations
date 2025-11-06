import type {
	PrismaClient,
	HelloWorldQuestionnaire,
	HelloWorldResponse
} from '@pins/local-plans-examinations-database';
import type { Logger } from 'pino';

export interface CreateResponseData {
	questionnaireId: string;
	userName: string;
	userMessage: string;
}

/**
 * Repository for Hello World questionnaire operations
 */
export class HelloWorldRepository {
	private readonly db: PrismaClient;
	private readonly logger: Logger;

	constructor(db: PrismaClient, logger: Logger) {
		this.db = db;
		this.logger = logger;
	}

	/**
	 * Get or create the hello world questionnaire
	 */
	async getOrCreateQuestionnaire(): Promise<HelloWorldQuestionnaire> {
		this.logger.debug('Getting or creating hello world questionnaire');

		// Try to find existing questionnaire
		let questionnaire = await this.db.helloWorldQuestionnaire.findFirst({
			where: { isActive: true }
		});

		// Create if it doesn't exist
		if (!questionnaire) {
			this.logger.info('Creating new hello world questionnaire');
			questionnaire = await this.db.helloWorldQuestionnaire.create({
				data: {
					title: 'Hello World Questionnaire',
					isActive: true
				}
			});
		}

		return questionnaire;
	}

	/**
	 * Create a new response
	 */
	async createResponse(data: CreateResponseData): Promise<HelloWorldResponse> {
		this.logger.info({ userName: data.userName }, 'Creating hello world response');

		return await this.db.helloWorldResponse.create({
			data,
			include: {
				questionnaire: true
			}
		});
	}

	/**
	 * Get all responses for admin view
	 */
	async getAllResponses(): Promise<HelloWorldResponse[]> {
		this.logger.debug('Getting all hello world responses');

		return await this.db.helloWorldResponse.findMany({
			include: {
				questionnaire: true
			},
			orderBy: {
				submittedAt: 'desc'
			}
		});
	}

	/**
	 * Get response by ID
	 */
	async getResponseById(id: string): Promise<HelloWorldResponse | null> {
		return await this.db.helloWorldResponse.findUnique({
			where: { id },
			include: {
				questionnaire: true
			}
		});
	}

	/**
	 * Get response count for analytics
	 */
	async getResponseCount(): Promise<number> {
		return await this.db.helloWorldResponse.count();
	}
}
