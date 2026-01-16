import {
	COMPONENT_TYPES,
	createQuestions,
	questionClasses,
	RequiredValidator,
	StringValidator,
	DateValidator
} from '@planning-inspectorate/dynamic-forms';

export function getQuestions() {
	const questions = {
		isItWorking: {
			type: COMPONENT_TYPES.BOOLEAN,
			title: 'Is it working?',
			question: 'Is it working?',
			fieldName: 'working',
			url: 'first-check',
			validators: [new RequiredValidator('Please select if this page is loading')]
		},
		q2: {
			type: COMPONENT_TYPES.BOOLEAN,
			title: 'Is it still working?',
			question: 'Is it still working?',
			fieldName: 'secondCheck',
			url: 'second-check',
			validators: [new RequiredValidator('Please select if this page is loading')]
		},
		q3: {
			type: COMPONENT_TYPES.BOOLEAN,
			title: 'Finally, is it working now?',
			question: 'Finally, is it working now?',
			fieldName: 'finalCheck',
			url: 'final-check',
			validators: [new RequiredValidator('Please select if this page is loading')]
		},
		developmentDescription: {
			type: COMPONENT_TYPES.TEXT_ENTRY,
			title: 'Development description',
			question: 'What is the description of the development?',
			hint: 'This will be published on the website.',
			fieldName: 'developmentDescription',
			url: 'development-description',
			validators: [
				new RequiredValidator('Enter description of the proposed development'),
				new StringValidator({
					maxLength: {
						maxLength: 1000,
						maxLengthMessage: 'Description of the proposed development must be 1000 characters or less'
					}
				})
			]
		},
		expectedDateOfSubmission: {
			type: COMPONENT_TYPES.DATE,
			title: 'Expected date of submission',
			question: 'What is the expected submission date for the application?',
			fieldName: 'expectedDateOfSubmission',
			url: 'expected-date-of-submission',
			validators: [new DateValidator('expected submission date')]
		}
	};
	return createQuestions(questions, questionClasses, {});
}
