import {
	COMPONENT_TYPES,
	createQuestions,
	RequiredValidator,
	questionClasses
} from '@planning-inspectorate/dynamic-forms';
import type { QuestionProps } from '@planning-inspectorate/dynamic-forms/types/src/questions/create-questions.d.ts';

const createACaseQuestions: Record<string, QuestionProps> = {
	caseName: {
		type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
		question: 'What is the name of the case?',
		fieldName: 'name',
		url: 'name',
		title: 'Case Name',
		validators: [new RequiredValidator()]
	},
	referenceNumber: {
		type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
		question: 'What is the reference number for the case?',
		fieldName: 'reference',
		url: 'reference',
		title: 'Case Reference',
		validators: [new RequiredValidator()]
	},
	email: {
		type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
		question: 'What is their email address?',
		fieldName: 'email',
		url: 'email',
		title: 'Case Email',
		validators: [new RequiredValidator()]
	}
};

export const questions = createQuestions(createACaseQuestions, questionClasses, {}, {});
