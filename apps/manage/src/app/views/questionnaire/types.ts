/**
 * Public API type definitions for questionnaire functionality
 */

/**
 * Database questionnaire submission record
 */
export interface QuestionnaireSubmission {
	id: string;
	createdAt: Date;
	fullName: string;
	email: string | null;
	rating: string;
	feedback: string;
	isDeleted: boolean;
}

/**
 * View model for questionnaire list page
 */
export interface QuestionnaireListViewModel {
	pageHeading: string;
	totalCount: number;
	submissions: QuestionnaireSubmission[];
	successMessage?: string;
	errorMessage?: string;
	questionnaireConfig: {
		questionnaireRoute: string;
		itemsRoute: string;
		emailNotProvided: string;
	};
}

/**
 * View model for questionnaire detail page
 */
export interface QuestionnaireDetailViewModel {
	pageHeading: string;
	submission: QuestionnaireSubmission;
	questionnaireConfig: {
		backLinkText: string;
		backLinkHref: string;
		emailNotProvided: string;
	};
}

/**
 * Request parameters for questionnaire detail
 */
export interface QuestionnaireDetailParams {
	id: string;
}
