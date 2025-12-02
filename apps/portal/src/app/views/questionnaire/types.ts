/**
 * Type definitions for questionnaire module
 */

/**
 * Type definition for questionnaire form answers
 */
export interface QuestionnaireAnswers {
	fullName: string;
	email?: string;
	wantToProvideEmail?: boolean;
	rating: string;
	feedback: string;
}

/**
 * Type definition for questionnaire submission object
 */
export interface QuestionnaireSubmission {
	id: string;
	reference: string;
	answers: QuestionnaireAnswers;
	submittedAt: Date;
}

/**
 * Type definition for database result from questionnaire creation
 */
export interface QuestionnaireDbResult {
	id: string;
	createdAt: Date;
}

/**
 * Type definition for questionnaire data service interface
 */
export interface QuestionnaireDataService {
	saveSubmission(answers: QuestionnaireAnswers): Promise<QuestionnaireDbResult>;
	getTotalSubmissions(): Promise<number>;
}

/**
 * Type definition for questionnaire business service interface
 */
export interface QuestionnaireBusinessService {
	saveSubmission(answers: QuestionnaireAnswers): Promise<QuestionnaireSubmission>;
	sendNotification(submission: QuestionnaireSubmission): Promise<void>;
	getTotalSubmissions(): Promise<number>;
}

/**
 * Type definition for session data structure
 */
export interface QuestionnaireSessionData {
	reference?: string;
	submitted?: boolean;
	error?: string;
}

/**
 * Type definition for questionnaire controller dependencies
 */
export interface QuestionnaireControllerDeps {
	questionnaireService: QuestionnaireBusinessService;
	startJourney: (req: any, res: any) => void;
	viewSuccessPage: (req: any, res: any) => void;
}
