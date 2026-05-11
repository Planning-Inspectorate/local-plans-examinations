import {
	COMPONENT_TYPES,
	createQuestions,
	RequiredValidator,
	questionClasses
} from '@planning-inspectorate/dynamic-forms';
import type { QuestionProps } from '@planning-inspectorate/dynamic-forms/types/src/questions/create-questions.d.ts';
import { CUSTOM_COMPONENT_CLASSES, CUSTOM_COMPONENTS } from '../layouts/index.ts';
import MultiFieldInputValidator from '../validators/multi-field-input-validator.ts';

const allQuestionClasses = {
	...questionClasses,
	...CUSTOM_COMPONENT_CLASSES
};

const createACaseQuestions: Record<string, QuestionProps> = {
	caseOfficer: {
		type: COMPONENT_TYPES.SELECT,
		options: [
			{ value: '', text: '' },
			{ value: 'officer-1', text: 'Case Officer 1' },
			{ value: 'officer-2', text: 'Case Officer 2' },
			{ value: 'officer-3', text: 'Case Officer 3' }
		],
		question: 'Who is the case officer?',
		fieldName: 'caseOfficer',
		url: 'case-officer',
		title: 'Case officer',
		validators: [new RequiredValidator('Select a case officer')],
		disableAccessibleAutocomplete: true
	},
	planTitle: {
		type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
		question: 'What is the plan title?',
		fieldName: 'planTitle',
		url: 'plan-title',
		title: 'Plan title',
		validators: [new RequiredValidator('Input a plan title')]
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
		title: 'Plan type',
		validators: [new RequiredValidator('Select a plan type')]
	},
	lpa: {
		type: COMPONENT_TYPES.SELECT,
		options: [
			{ value: '', text: '' },
			{ value: 'lpa-1', text: 'Local Planning Authority 1' },
			{ value: 'lpa-2', text: 'Local Planning Authority 2' },
			{ value: 'lpa-3', text: 'Local Planning Authority 3' },
			{ value: 'lpa-4', text: 'Local Planning Authority 4' }
		],
		question: 'Select the Local Planning Authority for this plan',
		fieldName: 'lpa',
		url: 'select-lpa',
		title: 'Local Planning Authority',
		validators: [new RequiredValidator('Select a Local Planning Authority')],
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
		validators: [new RequiredValidator('Please select if another Local Planning Authority is involved')]
	},
	secondaryLpa: {
		type: COMPONENT_TYPES.SELECT,
		options: [
			{ value: '', text: '' },
			{ value: 'lpa-1', text: 'Local Planning Authority 1' },
			{ value: 'lpa-2', text: 'Local Planning Authority 2' },
			{ value: 'lpa-3', text: 'Local Planning Authority 3' },
			{ value: 'lpa-4', text: 'Local Planning Authority 4' }
		],
		question: 'Select the Local Planning Authority for this plan',
		fieldName: 'secondaryLpa',
		url: 'select-second-lpa',
		title: 'Secondary Local Planning Authority',
		validators: [new RequiredValidator('Select a Local Planning Authority')],
		disableAccessibleAutocomplete: true
	},
	contactDetails: {
		type: CUSTOM_COMPONENTS.CUSTOM_MULTI_FIELD_INPUT,
		inputFields: [
			{
				type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
				fieldName: 'firstName',
				label: 'First name'
			},
			{
				type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
				fieldName: 'lastName',
				label: 'Last name'
			},
			{
				type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
				fieldName: 'email',
				label: 'Email address'
			},
			{ type: COMPONENT_TYPES.SINGLE_LINE_INPUT, fieldName: 'phone', label: 'Phone number (optional)' },
			{
				type: COMPONENT_TYPES.RADIO,
				fieldName: 'lpaContact',
				legend: 'Select the organisation for this contact',
				options: []
			}
		],
		validators: [
			new MultiFieldInputValidator({
				fields: [
					{
						fieldName: 'firstName',
						validators: [new RequiredValidator('Input a first name')]
					},
					{
						fieldName: 'lastName',
						validators: [new RequiredValidator('Input a last name')]
					},
					{
						fieldName: 'email',
						validators: [new RequiredValidator('Input an email address')]
					}
				]
			})
		],
		question: 'What are the main contact details for the Local Planning Authority?',
		fieldName: 'contactDetails',
		url: 'contact-details',
		title: 'Contact details'
	},
	anotherContact: {
		type: COMPONENT_TYPES.RADIO,
		question: 'Do you want to add another contact?',
		options: [
			{ value: 'yes', text: 'Yes' },
			{ value: 'no', text: 'No' }
		],
		fieldName: 'anotherContact',
		url: 'another-contact',
		title: 'Another contact',
		validators: [new RequiredValidator('Select if you want to add another contact')]
	},
	additionalContactDetails: {
		type: COMPONENT_TYPES.MULTI_FIELD_INPUT,
		inputFields: [
			{ fieldName: 'firstName2', label: 'First name', validators: [new RequiredValidator()] },
			{ fieldName: 'lastName2', label: 'Last name', validators: [new RequiredValidator()] },
			{ fieldName: 'email2', label: 'Email address', validators: [new RequiredValidator()] },
			{ fieldName: 'phone2', label: 'Phone number (optional)' }
		],
		question: 'Additional contact details',
		fieldName: 'additionalContactDetails',
		url: 'additional-contact-details',
		title: 'Additional contact details'
	},
	checkContactDetails: {
		type: COMPONENT_TYPES.MANAGE_LIST,
		title: 'Contact details',
		titleSingular: 'Contact',
		showManageListQuestions: true,
		fieldName: 'contactDetails',
		url: 'check-contact-details',
		showAnswersInSummary: true,
		question: 'Check contact details'
	},
	keyStageDates: {
		type: CUSTOM_COMPONENTS.CUSTOM_MULTI_FIELD_INPUT,
		inputFields: [
			{
				type: COMPONENT_TYPES.DATE,
				fieldName: 'intentionToCommenceDate',
				label: 'Date the Notice of Intention to Commence Plan Making was published'
			},
			{ type: COMPONENT_TYPES.DATE, fieldName: 'gateway1Date', label: 'Gateway 1 estimated date' },
			{ type: COMPONENT_TYPES.DATE, fieldName: 'gateway2Date', label: 'Gateway 2 estimated date' },
			{ type: COMPONENT_TYPES.DATE, fieldName: 'gateway3Date', label: 'Gateway 3 estimated date' },
			{ type: COMPONENT_TYPES.DATE, fieldName: 'submissionDate', label: 'Submission for examination date' }
		],
		question: 'Enter dates for key stages of the local plan',
		fieldName: 'keyStageDates',
		url: 'key-stage-dates',
		title: 'Dates'
	}
};

export const questions = createQuestions(createACaseQuestions, allQuestionClasses, {}, {});
