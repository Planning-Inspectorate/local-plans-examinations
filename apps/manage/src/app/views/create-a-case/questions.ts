import {
	COMPONENT_TYPES,
	createQuestions,
	RequiredValidator,
	DateValidator,
	questionClasses,
	type BaseQuestionProps
} from '@planning-inspectorate/dynamic-forms';
import { retrieveDefaultCaseOfficers } from '../../util/options-helper.ts';
import { CUSTOM_COMPONENT_CLASSES, CUSTOM_COMPONENTS } from '../layouts/index.ts';
import MultiFieldInputValidator from '../validators/multi-field-input-validator.ts';
import ManageListValidator from '../validators/manage-list-validator.ts';
import { PLAN_TYPE_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';
import type { ManageService } from '#service';
import { loadCaseOfficerOptions, loadLpaOptions } from '../../util/options-helper.ts';
import type { Request } from 'express';

type ManageQuestionConfig = BaseQuestionProps & Record<string, any>;

const allQuestionClasses = {
	...questionClasses,
	...CUSTOM_COMPONENT_CLASSES
};

const createACaseQuestions: Record<string, ManageQuestionConfig> = {
	caseOfficer: {
		type: COMPONENT_TYPES.SELECT,
		options: retrieveDefaultCaseOfficers(),
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
		validators: [new RequiredValidator('Enter a plan title')],
		inputAttributes: { 'data-cy': 'plan-title-input' }
	},
	planType: {
		type: COMPONENT_TYPES.RADIO,
		options: [
			{ value: PLAN_TYPE_ID.LOCAL_PLAN, text: 'Local plan' },
			{ value: PLAN_TYPE_ID.OTHER, text: 'Other' }
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
		question: 'Select a planning authority',
		fieldName: 'lpa',
		url: 'select-lpa',
		title: 'Local Planning Authority',
		validators: [new RequiredValidator('You need to select a planning authority')],
		disableAccessibleAutocomplete: true
	},
	checkLpas: {
		type: CUSTOM_COMPONENTS.CUSTOM_MANAGE_LIST,
		title: 'Planning authorities',
		titleSingular: 'Local Planning Authority',
		singularLowerCase: 'planning authority',
		multipleLowerCase: 'planning authorities',
		emptyListText: 'No planning authorities added',
		showManageListQuestions: true,
		fieldName: 'checkLpas',
		url: 'check-lpas',
		showAnswersInSummary: true,
		question: 'Check Local Planning Authorities',
		validators: [
			new ManageListValidator({
				minimumAnswers: 1,
				errorMessages: { minimumAnswers: 'You need to add a planning authority' }
			})
		]
	},
	contactDetails: {
		type: CUSTOM_COMPONENTS.CUSTOM_MULTI_FIELD_INPUT,
		inputFields: [
			{
				type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
				fieldName: 'firstName',
				label: 'First name',
				attributes: { 'data-cy': 'contact-first-name' }
			},
			{
				type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
				fieldName: 'lastName',
				label: 'Last name',
				attributes: { 'data-cy': 'contact-last-name' }
			},
			{
				type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
				fieldName: 'email',
				label: 'Email address',
				attributes: { 'data-cy': 'contact-email' }
			},
			{
				type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
				fieldName: 'phone',
				label: 'Phone number (optional)',
				attributes: { 'data-cy': 'contact-phone' }
			},
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
						validators: [new RequiredValidator('Enter a first name')]
					},
					{
						fieldName: 'lastName',
						validators: [new RequiredValidator('Enter a last name')]
					},
					{
						fieldName: 'email',
						validators: [new RequiredValidator('Enter an email address')]
					},
					{
						fieldName: 'lpaContact',
						validators: [new RequiredValidator('Select a planning authority')]
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
		singularLowerCase: 'contact',
		multipleLowerCase: 'contacts',
		emptyListText: 'No contacts added',
		showManageListQuestions: true,
		fieldName: 'contactDetails',
		url: 'check-contact-details',
		showAnswersInSummary: true,
		question: 'Check contact details',
		validators: [
			new ManageListValidator({
				minimumAnswers: 1,
				errorMessages: { minimumAnswers: 'You need to add a contact' }
			})
		]
	},
	keyStageDates: {
		type: CUSTOM_COMPONENTS.CUSTOM_MULTI_FIELD_INPUT,
		inputFields: [
			{
				type: COMPONENT_TYPES.DATE,
				fieldName: 'intentionToCommenceDate',
				label: 'Date the Notice of Intention to Commence Plan Making was published (optional)',
				hint: 'For example, 27 3 2007'
			},
			{ type: COMPONENT_TYPES.DATE, fieldName: 'gateway1Date', label: 'Gateway 1 submission expected (optional)' },
			{ type: COMPONENT_TYPES.DATE, fieldName: 'gateway2Date', label: 'Gateway 2 submission expected (optional)' },
			{ type: COMPONENT_TYPES.DATE, fieldName: 'gateway3Date', label: 'Gateway 3 submission expected (optional)' },
			{
				type: COMPONENT_TYPES.DATE,
				fieldName: 'expectedSubmissionForExaminationDate',
				label: 'Examination submission expected (optional)'
			}
		],
		question: 'Plan timetable',
		fieldName: 'keyStageDates',
		url: 'key-stage-dates',
		title: 'Timetable',
		listSeparate: true,
		validators: [
			new MultiFieldInputValidator({
				fields: [
					{
						fieldName: 'intentionToCommenceDate',
						validators: [
							new DateValidator('Date the Notice of Intention to Commence Plan Making was published', {
								optional: true
							})
						]
					},
					{
						fieldName: 'gateway1Date',
						validators: [new DateValidator('Gateway 1 submission expected', { optional: true })]
					},
					{
						fieldName: 'gateway2Date',
						validators: [new DateValidator('Gateway 2 submission expected', { optional: true })]
					},
					{
						fieldName: 'gateway3Date',
						validators: [new DateValidator('Gateway 3 submission expected', { optional: true })]
					},
					{
						fieldName: 'expectedSubmissionForExaminationDate',
						validators: [new DateValidator('Examination submission expected', { optional: true })]
					}
				]
			})
		]
	}
};

async function updateQuestionsWithOptions(service: ManageService, req: Request, questions: Record<string, any>) {
	await loadCaseOfficerOptions(service, req, questions);

	const lpaOptions = await loadLpaOptions(service);
	if (lpaOptions.length > 0) {
		questions.lpa.options = [{ value: '', text: '' }, ...lpaOptions];
	}
}

export const questions = createQuestions(
	createACaseQuestions,
	allQuestionClasses,
	{},
	{ continueButtonText: 'Save and continue' }
);

export async function getQuestions(
	service: ManageService,
	req: Request
): Promise<Record<string, ManageQuestionConfig>> {
	await updateQuestionsWithOptions(service, req, questions);
	return questions;
}
