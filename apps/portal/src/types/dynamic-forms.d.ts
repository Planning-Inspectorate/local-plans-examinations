// Type declarations for @planning-inspectorate/dynamic-forms
declare module '@planning-inspectorate/dynamic-forms' {
	export const COMPONENT_TYPES: any;
}

declare module '@planning-inspectorate/dynamic-forms/src/middleware/build-get-journey.js' {
	export function buildGetJourney(arg: any): any;
}

declare module '@planning-inspectorate/dynamic-forms/src/controller.js' {
	export function buildSave(journey: any): any;
	export function list(req: any, res: any, next: any): any;
	export function question(req: any, res: any, next: any): any;
}

declare module '@planning-inspectorate/dynamic-forms/src/validator/validator.js' {
	function validate(journey: any, req: any): any;
	export = validate;
}

declare module '@planning-inspectorate/dynamic-forms/src/validator/validation-error-handler.js' {
	export function validationErrorHandler(errors: any, req: any, res: any, next: any): any;
}

declare module '@planning-inspectorate/dynamic-forms/src/lib/session-answer-store.js' {
	export function buildSaveDataToSession(options?: any): any;
	export const saveDataToSession: any;
	export function clearDataFromSession(options: any): void;
	export function buildGetJourneyResponseFromSession(journeyId: string, reqParam?: string): any;
}

declare module '@planning-inspectorate/dynamic-forms/src/questions/create-questions.js' {
	export function createQuestions(
		questionProps: any,
		questionClasses: any,
		questionMethodOverrides?: any,
		textOverrides?: any
	): any;
}

declare module '@planning-inspectorate/dynamic-forms/src/questions/questions.js' {
	export const questionClasses: any;
}

declare module '@planning-inspectorate/dynamic-forms/src/validator/required-validator.js' {
	class RequiredValidator {
		constructor(message: string);
	}
	export = RequiredValidator;
}

declare module '@planning-inspectorate/dynamic-forms/src/validator/string-validator.js' {
	class StringValidator {
		constructor(options: any);
	}
	export = StringValidator;
}

declare module '@planning-inspectorate/dynamic-forms/src/section.js' {
	export class Section {
		constructor(name: string, segment: string);
		addQuestion(question: any): Section;
	}
}

declare module '@planning-inspectorate/dynamic-forms/src/journey/journey.js' {
	export class Journey {
		constructor(options: any);
	}
}

declare module '@planning-inspectorate/dynamic-forms/src/journey/journey-response.js' {
	export class JourneyResponse {
		constructor(journeyId: string, referenceId: string, answers: Record<string, unknown>, lpaCode?: string);
		journeyId: string;
		referenceId: string;
		answers: Record<string, unknown>;
		LPACode?: string;
	}
}

declare module '@planning-inspectorate/dynamic-forms/src/questions.js' {
	export interface QuestionMap {
		[key: string]: any;
	}
}
