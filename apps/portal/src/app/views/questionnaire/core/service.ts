import type { PortalService } from '#service';
import type { QuestionnaireAnswers, QuestionnaireSubmission } from '../types/types.ts';
import type { PrismaQuestionnaireRepository } from '../repository.ts';

/**
 * Session data structure for questionnaire submissions
 *
 * @typedef {Object} SessionData
 * @property {string} [reference] - Unique reference ID for the submission
 * @property {boolean} [submitted] - Whether the questionnaire was successfully submitted
 * @property {string} [error] - Error message if submission failed
 */
type SessionData = { reference?: string; submitted?: boolean; error?: string };

/**
 * Static utility class for managing questionnaire session data
 *
 * Handles storing, retrieving, and clearing questionnaire-related data
 * in the user's session for maintaining state across requests.
 */
export class SessionManager {
	/** Session key for storing questionnaire data */
	private static readonly SESSION_KEY = 'questionnaires';

	/**
	 * Stores questionnaire submission data in session
	 *
	 * @param {any} req - Express request object with session
	 * @param {QuestionnaireSubmission} submission - Completed questionnaire submission
	 */
	static store(req: any, submission: QuestionnaireSubmission): void {
		this.ensureSession(req);
		req.session[this.SESSION_KEY].lastReference = submission.reference;
		req.session[this.SESSION_KEY].submitted = true;
	}

	/**
	 * Retrieves questionnaire session data
	 *
	 * @param {any} req - Express request object with session
	 * @returns {SessionData} Session data or empty object if none exists
	 */
	static get(req: any): SessionData {
		const data = req.session[this.SESSION_KEY] || {};
		return {
			reference: data.lastReference,
			submitted: data.submitted,
			error: data.error
		};
	}

	/**
	 * Clears questionnaire data from session
	 *
	 * @param {any} req - Express request object with session
	 */
	static clear(req: any): void {
		if (req.session[this.SESSION_KEY]) {
			delete req.session[this.SESSION_KEY].lastReference;
			delete req.session[this.SESSION_KEY].submitted;
			delete req.session[this.SESSION_KEY].error;
		}
	}

	/**
	 * Sets an error message in session
	 *
	 * @param {any} req - Express request object with session
	 * @param {string} error - Error message to store
	 */
	static setError(req: any, error: string): void {
		this.ensureSession(req);
		req.session[this.SESSION_KEY].error = error;
	}

	/**
	 * Ensures session object exists for questionnaire data
	 *
	 * @param {any} req - Express request object with session
	 * @private
	 */
	private static ensureSession(req: any): void {
		if (!req.session[this.SESSION_KEY]) req.session[this.SESSION_KEY] = {};
	}
}

/**
 * Service class for handling questionnaire business logic
 *
 * Manages questionnaire submissions, notifications, and data persistence
 * while coordinating between the repository layer and external services.
 */
export class QuestionnaireService {
	private readonly logger: PortalService['logger'];
	private readonly repository: PrismaQuestionnaireRepository;

	/**
	 * Creates a new QuestionnaireService instance
	 *
	 * @param {PortalService['logger']} logger - Logger instance for service operations
	 * @param {PrismaQuestionnaireRepository} repository - Repository for data persistence
	 */
	constructor(logger: PortalService['logger'], repository: PrismaQuestionnaireRepository) {
		this.logger = logger;
		this.repository = repository;
	}

	/**
	 * Saves questionnaire answers to the database
	 *
	 * @param {QuestionnaireAnswers} answers - User's questionnaire responses
	 * @returns {Promise<QuestionnaireSubmission>} Saved submission with generated ID and reference
	 */
	async saveSubmission(answers: QuestionnaireAnswers): Promise<QuestionnaireSubmission> {
		const result = await this.repository.save(answers);
		const submission = this.createSubmission(result, answers);
		this.logger.info(`Questionnaire saved - ID: ${submission.id}`);
		return submission;
	}

	/**
	 * Sends notification for questionnaire submission
	 *
	 * Currently logs notification details. In production, this would
	 * integrate with email or other notification services.
	 *
	 * @param {QuestionnaireSubmission} submission - Completed submission to notify about
	 * @returns {Promise<void>}
	 */
	async sendNotification(submission: QuestionnaireSubmission): Promise<void> {
		this.logger.info({ reference: submission.reference, email: submission.answers.email }, 'Sending notification');
		// TODO: Implement actual notification
	}

	/**
	 * Creates a submission object from database result and answers
	 *
	 * @param {Object} result - Database save result
	 * @param {string} result.id - Generated submission ID
	 * @param {Date} result.createdAt - Submission timestamp
	 * @param {QuestionnaireAnswers} answers - User's questionnaire responses
	 * @returns {QuestionnaireSubmission} Complete submission object
	 * @private
	 */
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

	/**
	 * Gets total count of questionnaire submissions
	 *
	 * Useful for displaying statistics on home pages, dashboards,
	 * and admin interfaces across both portal and manage apps.
	 *
	 * @returns {Promise<number>} Total number of questionnaire submissions
	 *
	 * @example
	 * ```typescript
	 * const totalSubmissions = await questionnaireService.getTotalSubmissions();
	 * // Display on home page: "123 people have submitted feedback"
	 * ```
	 */
	async getTotalSubmissions(): Promise<number> {
		const count = await this.repository.count();
		this.logger.info(`Retrieved total questionnaire submissions: ${count}`);
		return count;
	}
}
