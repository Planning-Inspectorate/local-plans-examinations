import type { PortalService } from '#service';
import type { QuestionnaireAnswers, QuestionnaireSubmission } from '../types/types.ts';
import type { QuestionnaireService as QuestionnaireDataService } from '../data/service.ts';

/**
 * Session data structure for questionnaire submissions
 *
 * Defines the shape of questionnaire-related data stored in user sessions
 * for maintaining state across HTTP requests during the form completion process.
 *
 * @typedef {Object} SessionData
 * @property {string} [reference] - Unique reference ID for the completed submission
 * @property {boolean} [submitted] - Flag indicating successful questionnaire submission
 * @property {string} [error] - Error message if submission failed, used for user feedback
 */
type SessionData = { reference?: string; submitted?: boolean; error?: string };

/**
 * Static utility class for managing questionnaire session data
 *
 * Provides centralized session management for questionnaire submissions,
 * handling storing, retrieving, and clearing questionnaire-related data
 * in the user's session. Maintains state across HTTP requests during
 * the multi-step form completion process.
 *
 * @example
 * ```typescript
 * // Store submission data
 * SessionManager.store(req, submission);
 *
 * // Retrieve session data
 * const session = SessionManager.get(req);
 * if (session.submitted) {
 *   console.log(`Reference: ${session.reference}`);
 * }
 *
 * // Clear session after use
 * SessionManager.clear(req);
 * ```
 */
export class SessionManager {
	/** Session key for storing questionnaire data */
	private static readonly SESSION_KEY = 'questionnaires';

	/**
	 * Stores questionnaire submission data in session
	 *
	 * Saves the submission reference and success flag to session storage
	 * for display on the success page and tracking completion status.
	 *
	 * @param {any} req - Express request object containing session middleware data
	 * @param {QuestionnaireSubmission} submission - Completed questionnaire submission with reference
	 *
	 * @example
	 * ```typescript
	 * const submission = await service.saveSubmission(answers);
	 * SessionManager.store(req, submission);
	 * ```
	 */
	static store(req: any, submission: QuestionnaireSubmission): void {
		this.ensureSession(req);
		req.session[this.SESSION_KEY].lastReference = submission.reference;
		req.session[this.SESSION_KEY].submitted = true;
	}

	/**
	 * Retrieves questionnaire session data
	 *
	 * Gets stored questionnaire data from session, returning structured
	 * object with submission status, reference, and any error messages.
	 *
	 * @param {any} req - Express request object containing session middleware data
	 * @returns {SessionData} Session data object with reference, submitted flag, and error
	 *
	 * @example
	 * ```typescript
	 * const session = SessionManager.get(req);
	 * if (session.error) {
	 *   // Handle error case
	 * } else if (session.submitted) {
	 *   // Show success with reference
	 * }
	 * ```
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
	 * Removes all questionnaire-related data from session storage,
	 * typically called after successful display of success page.
	 *
	 * @param {any} req - Express request object containing session middleware data
	 *
	 * @example
	 * ```typescript
	 * // After showing success page
	 * SessionManager.clear(req);
	 * ```
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
	 * Stores error message in session for display to user on next request,
	 * typically used when submission fails and user needs feedback.
	 *
	 * @param {any} req - Express request object containing session middleware data
	 * @param {string} error - User-friendly error message to display
	 *
	 * @example
	 * ```typescript
	 * try {
	 *   await service.saveSubmission(answers);
	 * } catch (error) {
	 *   SessionManager.setError(req, 'Submission failed. Please try again.');
	 * }
	 * ```
	 */
	static setError(req: any, error: string): void {
		this.ensureSession(req);
		req.session[this.SESSION_KEY].error = error;
	}

	/**
	 * Ensures session object exists for questionnaire data
	 *
	 * Creates the questionnaire session namespace if it doesn't exist,
	 * preventing errors when storing questionnaire data.
	 *
	 * @param {any} req - Express request object containing session middleware data
	 * @private
	 */
	private static ensureSession(req: any): void {
		if (!req.session[this.SESSION_KEY]) req.session[this.SESSION_KEY] = {};
	}
}

/**
 * Service class for handling questionnaire business logic
 *
 * Orchestrates questionnaire operations including submissions, notifications,
 * and data persistence. Acts as the business logic layer coordinating between
 * controllers and data services while maintaining separation of concerns.
 *
 * @example
 * ```typescript
 * const service = new QuestionnaireService(logger, dataService);
 * const submission = await service.saveSubmission(answers);
 * await service.sendNotification(submission);
 * ```
 */
export class QuestionnaireService {
	private readonly logger: PortalService['logger'];
	private readonly dataService: QuestionnaireDataService;

	/**
	 * Creates a new QuestionnaireService instance
	 *
	 * Initializes the service with required dependencies for handling
	 * questionnaire business logic and data operations.
	 *
	 * @param {PortalService['logger']} logger - Pino logger instance for service operation tracking
	 * @param {QuestionnaireDataService} dataService - Data service for database persistence operations
	 */
	constructor(logger: PortalService['logger'], dataService: QuestionnaireDataService) {
		this.logger = logger;
		this.dataService = dataService;
	}

	/**
	 * Saves questionnaire answers to the database
	 *
	 * Processes user responses through the data layer, creates a complete
	 * submission object with metadata, and logs the operation for tracking.
	 *
	 * @param {QuestionnaireAnswers} answers - User's validated questionnaire responses
	 * @returns {Promise<QuestionnaireSubmission>} Complete submission object with ID, reference, and timestamp
	 *
	 * @example
	 * ```typescript
	 * const answers = { fullName: 'John Doe', email: 'john@example.com', rating: 'good', feedback: 'Great!' };
	 * const submission = await service.saveSubmission(answers);
	 * console.log(`Saved with reference: ${submission.reference}`);
	 * ```
	 */
	async saveSubmission(answers: QuestionnaireAnswers): Promise<QuestionnaireSubmission> {
		const result = await this.dataService.saveSubmission(answers);
		const submission = this.createSubmission(result, answers);
		this.logger.info(`Questionnaire saved - ID: ${submission.id}`);
		return submission;
	}

	/**
	 * Sends notification for questionnaire submission
	 *
	 * Handles post-submission notifications to relevant parties. Currently
	 * logs notification details for development. In production, this would
	 * integrate with email services, webhooks, or other notification systems.
	 *
	 * @param {QuestionnaireSubmission} submission - Completed submission containing user data and reference
	 * @returns {Promise<void>} Promise that resolves when notification is processed
	 *
	 * @example
	 * ```typescript
	 * await service.sendNotification(submission);
	 * // In production: sends email to admin team with submission details
	 * ```
	 *
	 * @todo Implement actual notification service integration (email, SMS, etc.)
	 */
	async sendNotification(submission: QuestionnaireSubmission): Promise<void> {
		this.logger.info({ reference: submission.reference, email: submission.answers.email }, 'Sending notification');
		// TODO: Implement actual notification
	}

	/**
	 * Creates a submission object from database result and answers
	 *
	 * Transforms database creation result and user answers into a complete
	 * submission object with proper structure for business logic operations.
	 *
	 * @param {Object} result - Database creation result from data service
	 * @param {string} result.id - Generated unique submission identifier
	 * @param {Date} result.createdAt - Timestamp when submission was created
	 * @param {QuestionnaireAnswers} answers - User's original questionnaire responses
	 * @returns {QuestionnaireSubmission} Complete submission object with metadata
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
		const count = await this.dataService.getTotalSubmissions();
		this.logger.info(`Retrieved total questionnaire submissions: ${count}`);
		return count;
	}
}
