import { HelloWorldRepository } from '../repositories/hello-world.repository.ts';
import type { BaseService } from '../app/base-service.ts';
import type { HelloWorldQuestionnaire, HelloWorldResponse } from '@pins/local-plans-examinations-database';

export interface HelloWorldFormData {
	userName: string;
	userMessage: string;
}

/**
 * Service for Hello World questionnaire business logic
 */
export class HelloWorldService {
	private repository: HelloWorldRepository;
	private baseService: BaseService;

	constructor(baseService: BaseService) {
		this.baseService = baseService;
		this.repository = new HelloWorldRepository(baseService.dbClient, baseService.logger);
	}

	/**
	 * Get the hello world questionnaire for public display
	 */
	async getQuestionnaire(): Promise<HelloWorldQuestionnaire> {
		return await this.repository.getOrCreateQuestionnaire();
	}

	/**
	 * Submit a hello world response
	 */
	async submitResponse(formData: HelloWorldFormData): Promise<HelloWorldResponse> {
		// Validate input
		this.validateFormData(formData);

		// Get or create questionnaire
		const questionnaire = await this.repository.getOrCreateQuestionnaire();

		// Create response
		const response = await this.repository.createResponse({
			questionnaireId: questionnaire.id,
			userName: formData.userName.trim(),
			userMessage: formData.userMessage.trim()
		});

		this.baseService.logger.info(
			{
				responseId: response.id,
				userName: formData.userName
			},
			'Hello world response submitted successfully'
		);

		return response;
	}

	/**
	 * Get all responses for admin view
	 */
	async getAllResponses(): Promise<HelloWorldResponse[]> {
		return await this.repository.getAllResponses();
	}

	/**
	 * Get analytics data for admin dashboard
	 */
	async getAnalytics() {
		const [questionnaire, responseCount, responses] = await Promise.all([
			this.repository.getOrCreateQuestionnaire(),
			this.repository.getResponseCount(),
			this.repository.getAllResponses()
		]);

		return {
			questionnaire,
			responseCount,
			latestResponses: responses.slice(0, 5), // Latest 5 responses
			averageMessageLength:
				responses.length > 0
					? Math.round(responses.reduce((sum: number, r: any) => sum + r.userMessage.length, 0) / responses.length)
					: 0
		};
	}

	/**
	 * Validate form data
	 */
	private validateFormData(formData: HelloWorldFormData): void {
		if (!formData.userName || formData.userName.trim().length === 0) {
			throw new Error('Name is required');
		}

		if (!formData.userMessage || formData.userMessage.trim().length === 0) {
			throw new Error('Message is required');
		}

		if (formData.userName.trim().length > 100) {
			throw new Error('Name must be 100 characters or less');
		}

		if (formData.userMessage.trim().length > 500) {
			throw new Error('Message must be 500 characters or less');
		}
	}
}
