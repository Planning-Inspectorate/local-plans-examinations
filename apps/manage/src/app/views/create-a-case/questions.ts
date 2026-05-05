import {
	COMPONENT_TYPES,
	createQuestions,
	RequiredValidator,
	questionClasses
} from '@planning-inspectorate/dynamic-forms';
import type { QuestionProps } from '@planning-inspectorate/dynamic-forms/types/src/questions/create-questions.d.ts';

const createACaseQuestions: Record<string, QuestionProps> = {
	caseOfficer: {
		type: COMPONENT_TYPES.SELECT,
		options: [
			{ value: 'officer-1', text: 'Case Officer 1' },
			{ value: 'officer-2', text: 'Case Officer 2' },
			{ value: 'officer-3', text: 'Case Officer 3' }
		],
		question: 'Who is the case officer?',
		fieldName: 'caseOfficer',
		url: 'case-officer',
		title: 'Case Officer',
		validators: [new RequiredValidator()],
		disableAccessibleAutocomplete: true
	},
	planTitle: {
		type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
		question: 'What is the plan title?',
		fieldName: 'planTitle',
		url: 'plan-title',
		title: 'Plan Title',
		validators: [new RequiredValidator()]
	},
	planType: {
		type: COMPONENT_TYPES.RADIO,
		options: [
			{ value: 'local-plan', text: 'Local Plan' },
			{ value: 'other', text: 'Other' }
		],
		question: 'What is the plan type?',
		fieldName: 'planType',
		url: 'plan-type',
		title: 'Plan Type',
		validators: [new RequiredValidator()]
	},
	lpa: {
		type: COMPONENT_TYPES.SELECT,
		options: [{ value: 'lpa-1', text: 'Local Planning Authority 1' }],
		question: 'Select the Local Planning Authority for this plan',
		fieldName: 'lpa',
		url: 'select-lpa',
		title: 'Local Planning Authority',
		validators: [new RequiredValidator()],
		disableAccessibleAutocomplete: true
	},
	anotherLpa: {
		type: COMPONENT_TYPES.RADIO,
		question: 'Is there another Local Planning Authority involved in this plan?',
		options: [
			{ value: 'yes', text: 'Yes' },
			{ value: 'no', text: 'No' }
		],
		fieldName: 'anotherLpa',
		url: 'another-lpa',
		title: 'Another Local Planning Authority',
		validators: [new RequiredValidator()]
	},
	contactDetails: {
		type: COMPONENT_TYPES.MULTI_FIELD_INPUT,
		inputFields: [
			{ name: 'firstName', label: 'First name' },
			{ name: 'lastName', label: 'Last name' },
			{ name: 'email', label: 'Email address' },
			{ name: 'phone', label: 'Phone number (optional)' }
		],
		question: 'What are the main contact details for the Local Planning Authority?',
		fieldName: 'contactDetails',
		url: 'contact-details',
		title: 'Contact Details',
		validators: [new RequiredValidator()]
	}
};

export const questions = createQuestions(createACaseQuestions, questionClasses, {}, {});
