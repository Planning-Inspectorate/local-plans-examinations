/**
 * Internal type definitions for questionnaire core functionality
 */

import type { QuestionnaireSubmission } from '../types.ts';

/**
 * Data service interface for questionnaire database operations
 */
export interface QuestionnaireDataService {
	getTotalSubmissions(): Promise<number>;
	getAllSubmissions(): Promise<QuestionnaireSubmission[]>;
	getSubmissionById(id: string): Promise<QuestionnaireSubmission | null>;
	deleteSubmission(id: string): Promise<void>;
}

/**
 * Business service interface for questionnaire operations
 */
export interface QuestionnaireBusinessService {
	getTotalSubmissions(): Promise<number>;
	getAllSubmissions(): Promise<QuestionnaireSubmission[]>;
	getSubmissionById(id: string): Promise<QuestionnaireSubmission | null>;
	deleteSubmission(id: string): Promise<void>;
}
