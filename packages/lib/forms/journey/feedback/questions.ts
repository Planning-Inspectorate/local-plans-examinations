import { createQuestions } from '@planning-inspectorate/dynamic-forms/src/questions/create-questions.js';
import { questionClasses } from '@planning-inspectorate/dynamic-forms/src/questions/questions.js';
import { COMPONENT_TYPES } from '@planning-inspectorate/dynamic-forms';
import RequiredValidator from '@planning-inspectorate/dynamic-forms/src/validator/required-validator.js';
import StringValidator from '@planning-inspectorate/dynamic-forms/src/validator/string-validator.js';
import EmailValidator from '@planning-inspectorate/dynamic-forms/src/validator/email-validator.js';

/**
 * Method overrides for dynamic form components.
 */
const METHOD_OVERRIDES = {
	'single-line-input': {},
	'text-entry': {},
	radio: {}
};

/**
 * Rating options for the service experience question.
 * Provides predefined choices for user satisfaction rating.
 */
const RATING_OPTIONS = [
	{ text: 'Excellent', value: 'excellent' },
	{ text: 'Good', value: 'good' },
	{ text: 'Average', value: 'average' },
	{ text: 'Poor', value: 'poor' }
];

/**
 * Complete question definitions with validation rules for the form.
 * Each question includes type, title, validation, and rendering configuration.
 */
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
	wantToProvideEmail: {
		type: COMPONENT_TYPES.BOOLEAN,
		title: 'Email Contact',
		question: 'Would you like to provide your email address for updates?',
		fieldName: 'wantToProvideEmail',
		url: 'want-email',
		validators: [new RequiredValidator('Select yes or no')]
	},
	email: {
		type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
		title: 'Email Address',
		question: 'What is your email address?',
		fieldName: 'email',
		url: 'email',
		validators: [
			new RequiredValidator('Enter your email address'),
			new EmailValidator({
				errorMessage: 'Enter an email address in the correct format, like name@example.com'
			})
		]
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

/**
 * Factory function that creates dynamic form questions with validation and rendering.
 * Combines question definitions with dynamic forms framework components.
 *
 * @returns Configured questions object for use in the dynamic forms system
 */
export const createFormQuestions = () => createQuestions(QUESTION_DEFINITIONS, questionClasses, METHOD_OVERRIDES);
