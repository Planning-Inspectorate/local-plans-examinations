/**
 * Generic form types - no business logic specific to any form type
 */

import type { Request, Response } from 'express';

/**
 * Generic form answers - can be any shape
 */
export type FormAnswers = Record<string, any>;

/**
 * Generic database submission record
 */
export interface FormDbSubmission {
	id: string;
	createdAt: Date;
	updatedAt: Date;
	[key: string]: any; // Allow any additional fields
}

/**
 * Database result from saving a form submission
 */
export interface FormDbResult {
	id: string;
	createdAt: Date;
}

/**
 * Complete form submission object
 */
export interface FormSubmission {
	id: string;
	reference: string;
	answers: FormAnswers;
	submittedAt: Date;
}

/**
 * Session data for form state
 */
export interface FormSessionData {
	reference?: string;
	submitted?: boolean;
	error?: string;
	successMessage?: string;
	errorMessage?: string;
}

/**
 * Express request with typed session
 */
export interface FormRequest extends Omit<Request, 'session'> {
	session: FormSessionData & Record<string, any>;
}

/**
 * Express response with typed locals
 */
export interface FormResponse extends Response {
	locals: {
		journey?: any;
		journeyResponse?: any;
		[key: string]: any;
	};
}

/**
 * Controller handler function type
 */
export type ControllerHandler = (req: FormRequest, res: FormResponse) => Promise<void> | void;

/**
 * Form questions configuration
 */
export interface FormQuestions {
	[key: string]: {
		question: string;
		type: string;
		validation?: Record<string, any>;
		options?: Array<{ value: string; text: string }>;
	};
}

/**
 * Generic data service interface
 */
export interface FormDataService {
	saveSubmission(answers: FormAnswers): Promise<FormDbResult>;
	getTotalSubmissions(): Promise<number>;
	getAllSubmissions(): Promise<FormDbSubmission[]>;
	getSubmissionById(id: string): Promise<FormDbSubmission | null>;
	updateSubmission(id: string, answers: FormAnswers): Promise<void>;
	deleteSubmission(id: string): Promise<void>;
}

/**
 * Generic business service interface
 */
export interface FormBusinessService {
	saveSubmission(answers: FormAnswers): Promise<FormSubmission>;
	sendNotification(submission: FormSubmission): Promise<void>;
	getTotalSubmissions(): Promise<number>;
	getAllSubmissions(): Promise<FormDbSubmission[]>;
	getSubmissionById(id: string): Promise<FormDbSubmission | null>;
	updateSubmission(id: string, answers: FormAnswers): Promise<void>;
	deleteSubmission(id: string): Promise<void>;
}

/**
 * Generic edit configuration
 */
export interface EditConfig<T = FormAnswers> {
	allowedFields: Record<string, FieldConfig<T>>;
	getFieldValue: (body: any, questionKey: string) => any;
	mapToAnswers: (questionKey: string, value: any, current: T) => T;
	submissionMapper: (submission: FormDbSubmission) => T;
	routeConfig: {
		baseRoute: string;
		editRoute: string;
		detailRoute: string;
	};
	messages: {
		notFound: string;
		updated: string;
		updateFailed: string;
	};
}

/**
 * Generic field configuration
 */
export interface FieldConfig<T = FormAnswers> {
	key: keyof T;
	required: boolean;
	validator?: (value: any) => string | null;
}
