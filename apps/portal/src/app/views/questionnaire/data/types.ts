/**
 * Interface representing user's questionnaire responses
 *
 * Contains all the form fields that users fill out during the questionnaire process.
 * Maps directly to the database schema for questionnaire submissions.
 *
 * @example
 * ```typescript
 * const answers: QuestionnaireAnswers = {
 *   fullName: 'John Doe',
 *   email: 'john@example.com',
 *   rating: 'excellent',
 *   feedback: 'Great service, very helpful staff!'
 * };
 * ```
 */
export interface QuestionnaireAnswers {
	/** User's full name as provided in the form */
	fullName: string;
	/** User's email address (optional field) */
	email: string;
	/** User's rating of the service (excellent, good, average, poor) */
	rating: string;
	/** User's detailed feedback about the service */
	feedback: string;
}

/**
 * Interface representing a complete questionnaire submission
 *
 * Contains the submission metadata along with the user's answers.
 * Used for displaying submission confirmations and managing submission records.
 *
 * @example
 * ```typescript
 * const submission: QuestionnaireSubmission = {
 *   id: 'clx123abc',
 *   reference: 'clx123abc',
 *   answers: { fullName: 'John Doe', email: 'john@example.com', rating: 'good', feedback: 'Helpful' },
 *   submittedAt: new Date()
 * };
 * ```
 */
export interface QuestionnaireSubmission {
	/** Unique identifier for the submission */
	id: string;
	/** Reference number shown to users for tracking */
	reference: string;
	/** User's questionnaire responses */
	answers: QuestionnaireAnswers;
	/** Timestamp when the submission was created */
	submittedAt: Date;
}
