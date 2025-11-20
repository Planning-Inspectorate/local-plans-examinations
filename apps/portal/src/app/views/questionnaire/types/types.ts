/**
 * Type definitions for the questionnaire domain
 *
 * Defines the structure of questionnaire data throughout the application,
 * ensuring type safety and consistent data handling.
 */

/**
 * User's responses to questionnaire questions
 *
 * @interface QuestionnaireAnswers
 * @property {string} fullName - Respondent's full name
 * @property {string} email - Respondent's email address (optional based on user preference)
 * @property {string} rating - Overall service rating (excellent, good, average, poor)
 * @property {string} feedback - Detailed feedback text
 */
export interface QuestionnaireAnswers {
	fullName: string;
	email: string;
	rating: string;
	feedback: string;
}

/**
 * Complete questionnaire submission with metadata
 *
 * Represents a saved questionnaire submission including the user's answers
 * and system-generated metadata for tracking and reference.
 *
 * @interface QuestionnaireSubmission
 * @property {string} id - Unique submission identifier (CUID)
 * @property {string} reference - User-friendly reference number (same as id)
 * @property {QuestionnaireAnswers} answers - User's questionnaire responses
 * @property {Date} submittedAt - Timestamp when submission was saved
 */
export interface QuestionnaireSubmission {
	id: string;
	reference: string;
	answers: QuestionnaireAnswers;
	submittedAt: Date;
}
