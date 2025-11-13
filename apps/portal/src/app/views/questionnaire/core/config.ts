/**
 * Questionnaire configuration settings
 * Contains all questionnaire-related configuration including templates, routing, and validation rules
 * @module QuestionnaireConfig
 */

import { COMPONENT_TYPES } from '@planning-inspectorate/dynamic-forms';
import RequiredValidator from '@planning-inspectorate/dynamic-forms/src/validator/required-validator.js';
import StringValidator from '@planning-inspectorate/dynamic-forms/src/validator/string-validator.js';

/** Main questionnaire configuration object */
export const QUESTIONNAIRE_CONFIG = {
	/** Unique identifier for the questionnaire journey */
	id: 'questionnaire',

	/** Template file paths for different pages */
	templates: {
		start: 'views/questionnaire/templates/form-start.njk',
		checkAnswers: 'views/layouts/forms-check-your-answers.njk',
		success: 'views/questionnaire/templates/form-success.njk',
		formQuestion: 'views/layouts/forms-question.njk'
	},

	/** URL routes and navigation paths */
	routing: {
		checkAnswers: 'check-your-answers',
		success: 'success',
		firstQuestion: '/personal/full-name'
	},

	/** Section definitions with questions grouping */
	sections: [
		{
			id: 'personal',
			title: 'Personal Information',
			questions: ['fullName', 'email']
		},
		{
			id: 'experience',
			title: 'Your Experience',
			questions: ['rating', 'feedback']
		}
	],

	/** Question definitions with validation rules and display properties */
	questions: {
		fullName: {
			type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
			title: 'Full Name',
			question: 'What is your full name?',
			fieldName: 'fullName',
			url: 'full-name',
			validators: [
				new RequiredValidator('Enter your full name'),
				new StringValidator({
					maxLength: {
						maxLength: 250,
						maxLengthMessage: 'Full name must be 250 characters or less'
					}
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
			options: [
				{ text: 'Excellent', value: 'excellent' },
				{ text: 'Good', value: 'good' },
				{ text: 'Average', value: 'average' },
				{ text: 'Poor', value: 'poor' }
			]
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
					maxLength: {
						maxLength: 2000,
						maxLengthMessage: 'Feedback must be 2000 characters or less'
					}
				})
			]
		}
	}
} as const;

/**
 * Structure for questionnaire answer data
 */
export interface QuestionnaireAnswers {
	fullName?: string;
	email?: string;
	rating?: string;
	feedback?: string;
}

/**
 * Structure for task list sections used in check answers template
 */
export interface TaskListSection {
	heading: string;
	status: string;
	list: {
		rows: Array<{
			key: { text: string };
			value: { text: string };
			actions: {
				items: Array<{
					href: string;
					text: string;
					visuallyHiddenText: string;
				}>;
			};
		}>;
	};
}
