/**
 * Type definitions for questionnaire functionality
 */

/**
 * User's answers to questionnaire questions
 */
export type QuestionnaireAnswers = Record<string, any>;

/**
 * Database result from saving a questionnaire submission
 */
export interface QuestionnaireDbResult {
	id: string;
	createdAt: Date;
}

/**
 * Complete questionnaire submission object
 */
export interface QuestionnaireSubmission {
	id: string;
	reference: string;
	answers: QuestionnaireAnswers;
	submittedAt: Date;
}

/**
 * Session data for questionnaire state
 */
export interface QuestionnaireSessionData {
	reference?: string;
	submitted?: boolean;
	error?: string;
}

/**
 * Data service interface for questionnaire database operations
 */
export interface QuestionnaireDataService {
	saveSubmission(answers: QuestionnaireAnswers): Promise<QuestionnaireDbResult>;
	getTotalSubmissions(): Promise<number>;
}

/**
 * Business service interface for questionnaire operations
 */
export interface QuestionnaireBusinessService {
	saveSubmission(answers: QuestionnaireAnswers): Promise<QuestionnaireSubmission>;
	sendNotification(submission: QuestionnaireSubmission): Promise<void>;
	getTotalSubmissions(): Promise<number>;
}
