import type { PortalService } from '#service';
import type { QuestionnaireAnswers, QuestionnaireSubmission } from '../types/types.ts';
import type { QuestionnaireService as QuestionnaireDataService } from '../data/service.ts';

// Session data for maintaining questionnaire state across requests
type SessionData = { reference?: string; submitted?: boolean; error?: string };

// Manages questionnaire session data across HTTP requests
export class SessionManager {
	/** Session key for storing questionnaire data */
	private static readonly SESSION_KEY = 'questionnaires';

	// Stores submission data for success page display
	static store(req: any, submission: QuestionnaireSubmission): void {
		this.ensureSession(req);
		req.session[this.SESSION_KEY].lastReference = submission.reference;
		req.session[this.SESSION_KEY].submitted = true;
	}

	static get(req: any): SessionData {
		const data = req.session[this.SESSION_KEY] || {};
		return {
			reference: data.lastReference,
			submitted: data.submitted,
			error: data.error
		};
	}

	static clear(req: any): void {
		if (req.session[this.SESSION_KEY]) {
			delete req.session[this.SESSION_KEY].lastReference;
			delete req.session[this.SESSION_KEY].submitted;
			delete req.session[this.SESSION_KEY].error;
		}
	}

	static setError(req: any, error: string): void {
		this.ensureSession(req);
		req.session[this.SESSION_KEY].error = error;
	}

	private static ensureSession(req: any): void {
		if (!req.session[this.SESSION_KEY]) req.session[this.SESSION_KEY] = {};
	}
}

// Business logic layer for questionnaire operations
export class QuestionnaireService {
	private readonly logger: PortalService['logger'];
	private readonly dataService: QuestionnaireDataService;

	constructor(logger: PortalService['logger'], dataService: QuestionnaireDataService) {
		this.logger = logger;
		this.dataService = dataService;
	}

	async saveSubmission(answers: QuestionnaireAnswers): Promise<QuestionnaireSubmission> {
		const result = await this.dataService.saveSubmission(answers);
		const submission = this.createSubmission(result, answers);
		this.logger.info(`Questionnaire saved - ID: ${submission.id}`);
		return submission;
	}

	// TODO: Implement actual notification service integration
	async sendNotification(submission: QuestionnaireSubmission): Promise<void> {
		this.logger.info({ reference: submission.reference, email: submission.answers.email }, 'Sending notification');
		// TODO: Implement actual notification
	}

	private createSubmission(
		result: { id: string; createdAt: Date },
		answers: QuestionnaireAnswers
	): QuestionnaireSubmission {
		return {
			id: result.id,
			reference: result.id,
			answers,
			submittedAt: result.createdAt
		};
	}

	// Used for displaying submission statistics on home page
	async getTotalSubmissions(): Promise<number> {
		const count = await this.dataService.getTotalSubmissions();
		this.logger.info(`Retrieved total questionnaire submissions: ${count}`);
		return count;
	}
}
