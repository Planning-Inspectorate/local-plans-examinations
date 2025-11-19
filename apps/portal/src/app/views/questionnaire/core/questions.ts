import { createQuestions } from '@planning-inspectorate/dynamic-forms/src/questions/create-questions.js';
import { questionClasses } from '@planning-inspectorate/dynamic-forms/src/questions/questions.js';
import { COMPONENT_TYPES } from '@planning-inspectorate/dynamic-forms';
import RequiredValidator from '@planning-inspectorate/dynamic-forms/src/validator/required-validator.js';
import StringValidator from '@planning-inspectorate/dynamic-forms/src/validator/string-validator.js';

const METHOD_OVERRIDES = {
	'single-line-input': {},
	'text-entry': {},
	radio: {}
};

const RATING_OPTIONS = [
	{ text: 'Excellent', value: 'excellent' },
	{ text: 'Good', value: 'good' },
	{ text: 'Average', value: 'average' },
	{ text: 'Poor', value: 'poor' }
];

const QUESTION_DEFINITIONS = {
	fullName: {
		type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
		title: 'Full Name',
		question: 'What is your full name?',
		fieldName: 'fullName',
		url: 'full-name',
		validators: [
			new RequiredValidator('Enter your full name'),
			new StringValidator({
				maxLength: { maxLength: 250, maxLengthMessage: 'Full name must be 250 characters or less' }
			})
		]
	},
	email: {
		type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
		title: 'Email Address',
		question: 'What is your email address?',
		fieldName: 'email',
		url: 'email',
		validators: [new RequiredValidator('Enter your email address')]
	},
	rating: {
		type: COMPONENT_TYPES.RADIO,
		title: 'Overall Rating',
		question: 'How would you rate your experience with the local plans service?',
		fieldName: 'rating',
		url: 'rating',
		validators: [new RequiredValidator('Select a rating')],
		options: RATING_OPTIONS
	},
	feedback: {
		type: COMPONENT_TYPES.TEXT_ENTRY,
		title: 'Feedback',
		question: 'Please provide your feedback about the local plans service',
		fieldName: 'feedback',
		url: 'feedback',
		validators: [
			new RequiredValidator('Enter your feedback'),
			new StringValidator({
				maxLength: { maxLength: 2000, maxLengthMessage: 'Feedback must be 2000 characters or less' }
			})
		]
	}
};

export const createQuestionnaireQuestions = () =>
	createQuestions(QUESTION_DEFINITIONS, questionClasses, METHOD_OVERRIDES);
