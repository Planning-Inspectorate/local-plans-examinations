/**
 * Questionnaire domain types
 */
export interface QuestionnaireAnswers {
	fullName: string;
	email: string;
	rating: string;
	feedback: string;
}

export interface QuestionnaireSubmission {
	id: string;
	reference: string;
	answers: QuestionnaireAnswers;
	submittedAt: Date;
}
