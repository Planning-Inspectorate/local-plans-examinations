import {
	COMPONENT_TYPES,
	createQuestions,
	RequiredValidator,
	questionClasses
} from '@planning-inspectorate/dynamic-forms';
import type { QuestionProps } from '@planning-inspectorate/dynamic-forms/types/src/questions/create-questions.d.ts';
import { CUSTOM_COMPONENT_CLASSES, CUSTOM_COMPONENTS } from '../layouts/index.ts';
import MultiFieldInputValidator from '../validators/multi-field-input-validator.ts';
import ManageListValidator from '../validators/manage-list-validator.ts';

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
	checkLpas: {
		type: CUSTOM_COMPONENTS.CUSTOM_MANAGE_LIST,
		title: 'Local Planning Authorities',
		titleSingular: 'Local Planning Authority',
		showManageListQuestions: true,
		fieldName: 'checkLpas',
		url: 'check-lpas',
		showAnswersInSummary: true,
		question: 'Check Local Planning Authorities',
		validators: [
			new ManageListValidator({
				minimumAnswers: 1,
				errorMessages: { minimumAnswers: 'You must add at least one Local Planning Authority' }
			})
		]
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
	checkContactDetails: {
		type: CUSTOM_COMPONENTS.CUSTOM_MANAGE_LIST,
		title: 'Contact details',
		titleSingular: 'Contact',
		showManageListQuestions: true,
		fieldName: 'contactDetails',
		url: 'check-contact-details',
		showAnswersInSummary: true,
		question: 'Check contact details',
		validators: [
			new ManageListValidator({
				minimumAnswers: 1,
				errorMessages: { minimumAnswers: 'You must add at least one contact' }
			})
		]
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
