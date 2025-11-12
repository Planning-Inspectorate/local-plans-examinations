import type { Request } from 'express';

// Question configuration interfaces
export interface QuestionValidator {
	// Using any to match the dynamic-forms validator interface
	[key: string]: any;
}

export interface StringValidatorConfig {
	maxLength?: {
		maxLength: number;
		maxLengthMessage: string;
	};
	minLength?: {
		minLength: number;
		minLengthMessage: string;
	};
}

export interface QuestionOption {
	text: string;
	value: string;
}

export interface QuestionProps {
	type: string;
	title: string;
	question: string;
	fieldName: string;
	url: string;
	validators: any[]; // Using any[] to match dynamic-forms validator classes
	options?: QuestionOption[];
}

export interface QuestionConfiguration {
	[questionName: string]: QuestionProps;
}

// Journey and session interfaces
export interface JourneyResponse {
	journeyId: string;
	referenceId: string;
	answers: Record<string, any>;
	LPACode?: string;
}

export interface QuestionMap {
	[questionName: string]: any;
}

export interface QuestionnaireAnswers {
	fullName?: string;
	email?: string;
	feedback?: string;
	rating?: string;
}

// Controller interfaces
export interface QuestionnaireControllers {
	getJourney: (req: Request, res: any, next: any) => void;
	getJourneyResponse: (req: Request, res: any, next: any) => void;
	saveDataToSession: (req: Request, res: any, next: any) => void;
	questions: QuestionMap;
}

// Service interfaces
export interface QuestionnaireService {
	getQuestions(): QuestionMap;
	createJourney(questions: QuestionMap, response: JourneyResponse, req: Request): any;
	processAnswers(answers: QuestionnaireAnswers): void;
}

// Section configuration
export interface SectionConfig {
	name: string;
	segment: string;
	questionNames: string[];
}

export interface QuestionnaireSections {
	personal: SectionConfig;
	experience: SectionConfig;
}
