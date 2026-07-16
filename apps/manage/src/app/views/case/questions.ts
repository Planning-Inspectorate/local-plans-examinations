import {
	COMPONENT_TYPES,
	createQuestions,
	RequiredValidator,
	questionClasses,
	DateValidator
} from '@planning-inspectorate/dynamic-forms';
import type { QuestionProps } from '@planning-inspectorate/dynamic-forms/types/src/questions/create-questions.d.ts';
import { CUSTOM_COMPONENT_CLASSES, CUSTOM_COMPONENTS } from '../layouts/index.ts';
import ManageListValidator from '../validators/manage-list-validator.ts';
import MultiFieldInputValidator from '../validators/multi-field-input-validator.ts';

const allQuestionClasses = {
	...questionClasses,
	...CUSTOM_COMPONENT_CLASSES
};

const caseQuestions: Record<string, QuestionProps> = {
	//overview
	planTitle: {
		type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
		question: 'What is the plan title?',
		fieldName: 'planTitle',
		url: 'plan-title',
		title: 'Plan title',
		validators: [new RequiredValidator('Input a plan title')]
	},
	planBand: {
		type: COMPONENT_TYPES.RADIO,
		options: [
			{ value: '1', text: '1' },
			{ value: '2', text: '2' },
			{ value: '3', text: '3' }
		],
		question: 'What is the plan band?',
		fieldName: 'planBand',
		url: 'plan-band',
		title: 'Plan band',
		validators: [new RequiredValidator('Select a plan band')]
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
		title: 'Local Planning Authority',
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
	programmeOfficer: {
		type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
		question: 'Who is the programme officer?',
		fieldName: 'programmeOfficer',
		url: 'programme-officer',
		title: 'Programme Officer',
		validators: [new RequiredValidator('Input a programme officer')]
	},
	examinationWebsite: {
		type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
		question: 'What is the examination website?',
		fieldName: 'examinationWebsite',
		url: 'examination-website',
		title: 'Examination website',
		validators: [new RequiredValidator('Input an examination website')]
	},
	assessorGateway2: {
		type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
		question: 'Who is the Assessor Gateway 2?',
		fieldName: 'assessorGateway2',
		url: 'assessor-gateway-2',
		title: 'Assessor Gateway 2',
		validators: [new RequiredValidator('Input Assessor Gateway 2')]
	},
	assessorGateway3: {
		type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
		question: 'Who is the Assessor Gateway 3?',
		fieldName: 'assessorGateway3',
		url: 'assessor-gateway-3',
		title: 'Assessor Gateway 3',
		validators: [new RequiredValidator('Input Assessor Gateway 3')]
	},
	examiningInspector1: {
		type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
		question: 'Who is the Examining Inspector 1?',
		fieldName: 'examiningInspector1',
		url: 'examining-inspector-1',
		title: 'Examining Inspector 1',
		validators: [new RequiredValidator('Input Examining Inspector 1')]
	},
	examiningInspector2: {
		type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
		question: 'Who is the Examining Inspector 2?',
		fieldName: 'examiningInspector2',
		url: 'examining-inspector-2',
		title: 'Examining Inspector 2',
		validators: [new RequiredValidator('Input Examining Inspector 2')]
	},
	examiningInspector3: {
		type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
		question: 'Who is the Examining Inspector 3?',
		fieldName: 'examiningInspector3',
		url: 'examining-inspector-3',
		title: 'Examining Inspector 3',
		validators: [new RequiredValidator('Input Examining Inspector 3')]
	},
	qaInspector1: {
		type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
		question: 'Who is the QA Inspector 1?',
		fieldName: 'qaInspector1',
		url: 'qa-inspector-1',
		title: 'QA Inspector 1',
		validators: [new RequiredValidator('Input QA Inspector 1')]
	},
	qaInspector2: {
		type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
		question: 'Who is the QA Inspector 2?',
		fieldName: 'qaInspector2',
		url: 'qa-inspector-2',
		title: 'QA Inspector 2',
		validators: [new RequiredValidator('Input QA Inspector 2')]
	},
	qaInspector3: {
		type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
		question: 'Who is the QA Inspector 3?',
		fieldName: 'qaInspector3',
		url: 'qa-inspector-3',
		title: 'QA Inspector 3',
		validators: [new RequiredValidator('Input QA Inspector 3')]
	},
	//gateway 1
	noticeOfIntentionPublishDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When was the Notice of Intention published?',
		fieldName: 'noticeOfIntention',
		url: 'notice-of-intention-publish-date',
		title: 'Notice of Intention publish date',
		validators: [new DateValidator('Enter a date')],
		inputAttributes: { 'data-cy': 'notice-of-intention-publish-date' }
	},
	gateway1estimatedDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'What is the estimated Gateway 1 date?',
		fieldName: 'estimatedGateway1Date',
		url: 'estimated-gateway-1-date',
		title: 'Estimated Gateway 1 date',
		validators: [new DateValidator('Enter a date')],
		inputAttributes: { 'data-cy': 'estimated-gateway-1-date' }
	},
	gateway1ActualDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When was Gateway 1 completed?',
		fieldName: 'completedGateway1Date',
		url: 'completed-gateway-1-date',
		title: 'Completed Gateway 1 date',
		validators: [new DateValidator('Enter a date')],
		inputAttributes: { 'data-cy': 'completed-gateway-1-date' }
	},
	slaSentDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When was the SLA sent?',
		fieldName: 'slaSentDate',
		url: 'sla-sent-date',
		title: 'SLA sent date',
		validators: [new DateValidator('Enter a date')],
		inputAttributes: { 'data-cy': 'sla-sent-date' }
	},
	slaReceivedDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When was the SLA received?',
		fieldName: 'slaReceivedDate',
		url: 'sla-received-date',
		title: 'SLA received date',
		validators: [new DateValidator('Enter a date')],
		inputAttributes: { 'data-cy': 'sla-received-date' }
	},
	dsaCheck: {
		type: COMPONENT_TYPES.RADIO,
		question: 'Is the DSA checked?',
		fieldName: 'dsaChecked',
		url: 'dsa-checked',
		title: 'DSA checked',
		options: [
			{ value: 'yes', text: 'Yes' },
			{ value: 'no', text: 'No' }
		],
		validators: [new RequiredValidator('Select an option')]
	},
	//gateway 2
	gateway2EstimatedDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'What is the estimated Gateway 2 date?',
		fieldName: 'estimatedDate',
		url: 'gateway-2-estimated-date',
		title: 'Gateway 2 estimated date',
		validators: [new DateValidator('Enter a date')],
		inputAttributes: { 'data-cy': 'gateway-2-estimated-date' }
	},
	gateway2ActualDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When was Gateway 2 completed?',
		fieldName: 'actualDate',
		url: 'gateway-2-actual-date',
		title: 'Gateway 2 actual date',
		validators: [new DateValidator('Enter a date')],
		inputAttributes: { 'data-cy': 'gateway-2-actual-date' }
	},
	gateway2ValidDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'What is the Gateway 2 valid date?',
		fieldName: 'validDate',
		url: 'gateway-2-valid-date',
		title: 'Gateway 2 valid date',
		validators: [new DateValidator('Enter a date')],
		inputAttributes: { 'data-cy': 'gateway-2-valid-date' }
	},
	gateway2AssessorsName: {
		type: COMPONENT_TYPES.SELECT,
		question: 'Who is the Gateway 2 assessor?',
		options: [
			{ value: '', text: '' },
			{ value: 'assessor-1', text: 'Assessor 1' },
			{ value: 'assessor-2', text: 'Assessor 2' },
			{ value: 'assessor-3', text: 'Assessor 3' },
			{ value: 'assessor-4', text: 'Assessor 4' }
		],
		fieldName: 'assessorName',
		url: 'gateway-2-assessor',
		title: 'Gateway 2 assessor',
		validators: [new RequiredValidator('Select a name')],
		inputAttributes: { 'data-cy': 'gateway-2-assessor' }
	},
	assessorDateOfAppointment: {
		type: COMPONENT_TYPES.DATE,
		question: 'When was the Gateway 2 assessor appointed?',
		fieldName: 'assessorAppointmentDate',
		url: 'gateway-2-assessor-appointed',
		title: 'Assessor date of appointment',
		validators: [new DateValidator('Enter a date')],
		inputAttributes: { 'data-cy': 'gateway-2-assessor-appointed' }
	},
	workshopDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When is the Gateway 2 workshop?',
		fieldName: 'workshopDate',
		url: 'gateway-2-workshop-date',
		title: 'Workshop date',
		validators: [new DateValidator('Enter a date')],
		inputAttributes: { 'data-cy': 'gateway-2-workshop-date' }
	},
	workshopVenue: {
		type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
		question: 'What is the venue for the Gateway 2 workshop?',
		fieldName: 'workshopVenue',
		url: 'gateway-2-workshop-venue',
		title: 'Workshop venue',
		validators: [new RequiredValidator('Enter a venue name')],
		inputAttributes: { 'data-cy': 'gateway-2-workshop-venue' }
	},
	reportIssuedDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When was the report issued?',
		fieldName: 'reportIssuedDate',
		url: 'gateway-2-report-issued-date',
		title: 'Report issued date',
		validators: [new DateValidator('Enter a date')],
		inputAttributes: { 'data-cy': 'gateway-2-report-issued-date' }
	},
	reportPublishedDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When was the report published by the LPA?',
		fieldName: 'reportPublishedByLPA',
		url: 'gateway-2-report-published-date',
		title: 'Report published by LPA date',
		validators: [new DateValidator('Enter a date')],
		inputAttributes: { 'data-cy': 'gateway-2-report-published-date' }
	}
};

export const questions = createQuestions(
	caseQuestions,
	allQuestionClasses,
	{},
	{ continueButtonText: 'Save and continue' }
);
