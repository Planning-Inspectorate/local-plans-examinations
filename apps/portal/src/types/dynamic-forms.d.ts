declare module '@planning-inspectorate/dynamic-forms/src/journey/journey.js' {
	interface JourneyOptions {
		journeyId: string;
		makeBaseUrl: (response: JourneyResponse | unknown) => string;
		taskListUrl?: string;
		response: JourneyResponse | unknown;
		journeyTemplate: string;
		taskListTemplate: string;
		informationPageViewPath?: string;
		journeyTitle: string;
		returnToListing?: boolean;
		sections: Section[];
		initialBackLink?: string;
	}

	interface JourneyResponse {
		journeyId: string;
		referenceId: string;
		answers: Record<string, unknown>;
	}

	interface Section {
		segment: string;
		name: string;
		questions: Question[];
		getStatus(response: JourneyResponse): string;
		isComplete(response: JourneyResponse): boolean;
	}

	interface Question {
		fieldName: string;
		url?: string;
		shouldDisplay?(response: JourneyResponse): boolean;
		isRequired?(): boolean;
		isAnswered?(response: JourneyResponse): boolean;
		[key: string]: unknown;
	}

	export class Journey {
		constructor(options: JourneyOptions);
		journeyId: string;
		journeyTitle: string;
		taskListUrl: string;
		journeyTemplate: string;
		taskListTemplate: string;
		returnToListing: boolean;
		initialBackLink: string | null;
		makeBaseUrl: (response: JourneyResponse | unknown) => string;
		response: JourneyResponse | unknown;
		sections: Section[];
		baseUrl: string;
		getSection(sectionSegment: string): Section | undefined;
		getQuestionBySectionAndName(sectionSegment: string, questionSegment: string): Question | undefined;
		isComplete(): boolean;
		setResponse(journeyResponse: JourneyResponse): void;
	}
}

declare module '@planning-inspectorate/dynamic-forms/src/section.js' {
	type QuestionCondition = (response: JourneyResponse) => boolean;

	interface JourneyResponse {
		answers: Record<string, unknown>;
	}

	interface Question {
		fieldName: string;
		validators?: any[];
		shouldDisplay?: (response: JourneyResponse) => boolean;
		[key: string]: unknown;
	}

	export class Section {
		name: string;
		segment: string;
		questions: Question[];
		constructor(name: string, segment: string);
		addQuestion(question: Question): Section;
		withCondition(condition: QuestionCondition): Section;
		withSectionCondition(condition: QuestionCondition): Section;
		startMultiQuestionCondition(name: string, condition: QuestionCondition): Section;
		endMultiQuestionCondition(name: string): Section;
		getStatus(journeyResponse: JourneyResponse): string;
		isComplete(journeyResponse: JourneyResponse): boolean;
	}

	export const SECTION_STATUS: {
		NOT_STARTED: 'Not started';
		IN_PROGRESS: 'In progress';
		COMPLETE: 'Completed';
	};
}

declare module '@planning-inspectorate/dynamic-forms/src/components/utils/question-has-answer.js' {
	interface JourneyResponse {
		answers: Record<string, unknown>;
	}

	interface Question {
		fieldName: string;
	}

	export function questionHasAnswer(response: JourneyResponse, question: Question, value: string): boolean;
}

declare module '@planning-inspectorate/dynamic-forms/src/components/boolean/question.js' {
	export const BOOLEAN_OPTIONS: {
		YES: string;
		NO: string;
	};
}

declare module '@planning-inspectorate/dynamic-forms/src/questions/create-questions.js' {
	interface QuestionDefinition {
		type: string;
		title: string;
		question: string;
		fieldName: string;
		url?: string;
		validators?: any[];
		options?: Array<{ text: string; value: string }>;
		[key: string]: unknown;
	}

	type QuestionDefinitions = Record<string, QuestionDefinition>;

	export function createQuestions(definitions: QuestionDefinitions, req?: any, res?: any): Record<string, any>;
}

declare module '@planning-inspectorate/dynamic-forms/src/questions/questions.js' {
	export const questionClasses: Record<string, any>;
}

declare module '@planning-inspectorate/dynamic-forms' {
	export const COMPONENT_TYPES: {
		CHECKBOX: 'checkbox';
		BOOLEAN: 'boolean';
		RADIO: 'radio';
		DATE: 'date';
		DATE_PERIOD: 'date-period';
		DATE_TIME: 'date-time';
		TEXT_ENTRY: 'text-entry';
		TEXT_ENTRY_REDACT: 'text-entry-redact';
		SELECT: 'select';
		SINGLE_LINE_INPUT: 'single-line-input';
		MULTI_FIELD_INPUT: 'multi-field-input';
		NUMBER: 'number';
		ADDRESS: 'site-address';
		UNIT_OPTION: 'unit-option';
	};
}

declare module '@planning-inspectorate/dynamic-forms/src/validator/required-validator.js' {
	class RequiredValidator {
		constructor(errorMessage?: string);
		errorMessage: string;
		validate(questionObj: { fieldName: string }): any;
	}
	export = RequiredValidator;
}

declare module '@planning-inspectorate/dynamic-forms/src/validator/string-validator.js' {
	interface StringValidatorOptions {
		minLength?: { minLength: number; minLengthMessage?: string };
		maxLength?: { maxLength: number; maxLengthMessage?: string };
		regex?: { regex: string | RegExp; regexMessage?: string };
		fieldName?: string;
	}

	class StringValidator {
		constructor(options?: StringValidatorOptions);
		validate(questionObj: { fieldName: string }): any;
	}
	export = StringValidator;
}

declare module '@planning-inspectorate/dynamic-forms/src/validator/email-validator.js' {
	interface EmailValidationOptions {
		allowDisplayName?: boolean;
		requireTld?: boolean;
		allowUtf8LocalPart?: boolean;
		allowIpDomain?: boolean;
	}

	interface EmailValidatorParams {
		options?: EmailValidationOptions;
		errorMessage?: string;
		fieldName?: string;
	}

	class EmailValidator {
		constructor(params?: EmailValidatorParams);
		validate(questionObj: { fieldName: string }): any;
	}
	export = EmailValidator;
}

declare module '@planning-inspectorate/dynamic-forms/src/middleware/build-get-journey.js' {
	import { Request, Response, NextFunction } from 'express';

	type JourneyFactory = (req: Request, journeyResponse: unknown) => any;

	export function buildGetJourney(
		journeyFactory: JourneyFactory
	): (req: Request, res: Response, next: NextFunction) => void;
}

declare module '@planning-inspectorate/dynamic-forms/src/controller.js' {
	import { Request, Response, RequestHandler } from 'express';

	interface SaveParams {
		req: Request;
		res: Response;
		journeyId: string;
		referenceId: string;
		data: { answers?: Record<string, unknown> };
	}

	type SaveDataFn = (params: SaveParams) => Promise<void>;

	export function list(req: Request, res: Response, pageCaption?: string, viewData?: object): Promise<Response>;
	export function question(req: Request, res: Response): Promise<Response | void>;
	export function buildSave(saveData: MiddlewareSaveDataFn, redirectToTaskListOnSuccess?: boolean): RequestHandler;
}

declare module '@planning-inspectorate/dynamic-forms/src/validator/validator.js' {
	import { Request, Response, NextFunction } from 'express';

	const validate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
	export = validate;
}

declare module '@planning-inspectorate/dynamic-forms/src/validator/validation-error-handler.js' {
	import { Request, Response, NextFunction } from 'express';

	export function validationErrorHandler(req: Request, res: Response, next: NextFunction): void;
}

declare module '@planning-inspectorate/dynamic-forms/src/lib/session-answer-store.js' {
	import { Request, Response, NextFunction } from 'express';

	export default class SessionAnswerStore {
		constructor(req: Request);
		getAnswers(): Record<string, unknown>;
		setAnswers(answers: Record<string, unknown>): void;
	}

	interface ClearDataParams {
		req: Request;
		journeyId: string;
		replaceWith?: Record<string, unknown>;
		reqParam?: string;
	}

	interface SaveDataParams {
		req: Request;
		journeyId: string;
		data?: { answers?: Record<string, unknown> };
	}

	type SaveDataFn = (params: SaveDataParams) => Promise<void>;

	interface MiddlewareSaveDataFn {
		(req: Request, res: Response, next: NextFunction): void;
	}

	export function clearDataFromSession(params: ClearDataParams): void;
	export function buildGetJourneyResponseFromSession(
		journeyId: string,
		reqParam?: string
	): (req: Request, res: Response, next: NextFunction) => void;
	export function buildSaveDataToSession(options?: { reqParam?: string }): MiddlewareSaveDataFn;
	export const saveDataToSession: SaveDataFn;
}
