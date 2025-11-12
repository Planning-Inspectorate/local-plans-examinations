import { createQuestions } from '@planning-inspectorate/dynamic-forms/src/questions/create-questions.js';
import { questionClasses } from '@planning-inspectorate/dynamic-forms/src/questions/questions.js';
import { COMPONENT_TYPES } from '@planning-inspectorate/dynamic-forms';
import RequiredValidator from '@planning-inspectorate/dynamic-forms/src/validator/required-validator.js';
import StringValidator from '@planning-inspectorate/dynamic-forms/src/validator/string-validator.js';
import type { QuestionConfiguration, QuestionMap } from './types.ts';
import { QUESTIONNAIRE_CONFIG } from './config.ts';

export const getQuestions = (): QuestionMap => {
	const questionProps: QuestionConfiguration = {
		fullName: {
			type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
			title: 'Full Name',
			question: 'What is your full name?',
			fieldName: QUESTIONNAIRE_CONFIG.QUESTIONS.FULL_NAME.fieldName,
			url: QUESTIONNAIRE_CONFIG.QUESTIONS.FULL_NAME.url,
			validators: [
				new RequiredValidator(QUESTIONNAIRE_CONFIG.MESSAGES.REQUIRED.FULL_NAME),
				new StringValidator({
					maxLength: {
						maxLength: QUESTIONNAIRE_CONFIG.VALIDATION.FULL_NAME_MAX_LENGTH,
						maxLengthMessage: QUESTIONNAIRE_CONFIG.MESSAGES.VALIDATION.FULL_NAME_TOO_LONG
					}
				})
			]
		},
		email: {
			type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
			title: 'Email Address',
			question: 'What is your email address?',
			fieldName: QUESTIONNAIRE_CONFIG.QUESTIONS.EMAIL.fieldName,
			url: QUESTIONNAIRE_CONFIG.QUESTIONS.EMAIL.url,
			validators: [new RequiredValidator(QUESTIONNAIRE_CONFIG.MESSAGES.REQUIRED.EMAIL)]
		},
		feedback: {
			type: COMPONENT_TYPES.TEXT_ENTRY,
			title: 'Feedback',
			question: 'Please provide your feedback about the local plans service',
			fieldName: QUESTIONNAIRE_CONFIG.QUESTIONS.FEEDBACK.fieldName,
			url: QUESTIONNAIRE_CONFIG.QUESTIONS.FEEDBACK.url,
			validators: [
				new RequiredValidator(QUESTIONNAIRE_CONFIG.MESSAGES.REQUIRED.FEEDBACK),
				new StringValidator({
					maxLength: {
						maxLength: QUESTIONNAIRE_CONFIG.VALIDATION.FEEDBACK_MAX_LENGTH,
						maxLengthMessage: QUESTIONNAIRE_CONFIG.MESSAGES.VALIDATION.FEEDBACK_TOO_LONG
					}
				})
			]
		},
		rating: {
			type: COMPONENT_TYPES.RADIO,
			title: 'Overall Rating',
			question: 'How would you rate your experience with the local plans service?',
			fieldName: QUESTIONNAIRE_CONFIG.QUESTIONS.RATING.fieldName,
			url: QUESTIONNAIRE_CONFIG.QUESTIONS.RATING.url,
			validators: [new RequiredValidator(QUESTIONNAIRE_CONFIG.MESSAGES.REQUIRED.RATING)],
			options: QUESTIONNAIRE_CONFIG.OPTIONS.RATING
		}
	};

	// Create empty method overrides for each question type used
	const questionMethodOverrides = {
		[QUESTIONNAIRE_CONFIG.COMPONENT_TYPES.SINGLE_LINE_INPUT]: {},
		[QUESTIONNAIRE_CONFIG.COMPONENT_TYPES.TEXT_ENTRY]: {},
		[QUESTIONNAIRE_CONFIG.COMPONENT_TYPES.RADIO]: {}
	};

	return createQuestions(questionProps, questionClasses, questionMethodOverrides);
};
