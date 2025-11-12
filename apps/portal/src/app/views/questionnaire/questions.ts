import { createQuestions } from '@planning-inspectorate/dynamic-forms/src/questions/create-questions.js';
import { questionClasses } from '@planning-inspectorate/dynamic-forms/src/questions/questions.js';
import { COMPONENT_TYPES } from '@planning-inspectorate/dynamic-forms';
import RequiredValidator from '@planning-inspectorate/dynamic-forms/src/validator/required-validator.js';
import StringValidator from '@planning-inspectorate/dynamic-forms/src/validator/string-validator.js';

export const getQuestions = () => {
	const questionProps = {
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
		}
	};

	// Create empty method overrides for each question type used
	// Using actual string values that match the COMPONENT_TYPES constants
	const questionMethodOverrides = {
		'single-line-input': {},
		'text-entry': {},
		radio: {}
	};

	return createQuestions(questionProps, questionClasses, questionMethodOverrides);
};
