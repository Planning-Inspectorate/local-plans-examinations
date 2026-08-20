import {
	COMPONENT_TYPES,
	createQuestions,
	RequiredValidator,
	questionClasses,
	DateValidator,
	type BaseQuestionProps
} from '@planning-inspectorate/dynamic-forms';
import { CUSTOM_COMPONENT_CLASSES, CUSTOM_COMPONENTS } from '../layouts/index.ts';
import ManageListValidator from '../validators/manage-list-validator.ts';
import MultiFieldInputValidator from '../validators/multi-field-input-validator.ts';

type ManageQuestionConfig = BaseQuestionProps & Record<string, any>;

const allQuestionClasses = {
	...questionClasses,
	...CUSTOM_COMPONENT_CLASSES
};

const caseQuestions: Record<string, ManageQuestionConfig> = {
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
	examinationWebsite: {
		type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
		question: 'What is the address of the examination website?',
		fieldName: 'examinationWebsite',
		url: 'examination-website',
		title: 'Examination website',
		validators: [new RequiredValidator('Input an examination website')]
	},
	assessorGateway2: {
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
		url: 'assessor-gateway-2',
		title: 'Assessor Gateway 2',
		validators: [new RequiredValidator('Select a name')],
		inputAttributes: { 'data-cy': 'gateway-2-assessor' }
	},
	assessorGateway3: {
		type: COMPONENT_TYPES.SELECT,
		question: 'Who is the Gateway 3 assessor?',
		options: [
			{ value: '', text: '' },
			{ value: 'assessor-1', text: 'Assessor 1' },
			{ value: 'assessor-2', text: 'Assessor 2' },
			{ value: 'assessor-3', text: 'Assessor 3' },
			{ value: 'assessor-4', text: 'Assessor 4' }
		],
		fieldName: 'gateway3AssessorName',
		url: 'assessor-gateway-3',
		title: 'Assessor Gateway 3',
		validators: [new RequiredValidator('Select a name')],
		inputAttributes: { 'data-cy': 'gateway-3-assessor' }
	},
	examiningInspector1: {
		type: COMPONENT_TYPES.SELECT,
		question: 'Which Inspector is assigned for Examination?',
		options: [
			{ value: '', text: '' },
			{ value: 'inspector-1', text: 'Inspector 1' },
			{ value: 'inspector-2', text: 'Inspector 2' },
			{ value: 'inspector-3', text: 'Inspector 3' },
			{ value: 'inspector-4', text: 'Inspector 4' }
		],
		fieldName: 'examiningInspector1',
		url: 'examining-inspector-1',
		title: 'Examining Inspector 1',
		validators: [new RequiredValidator('Input Examining Inspector 1')]
	},
	examiningInspector2: {
		type: COMPONENT_TYPES.SELECT,
		question: 'Which Inspector is assigned for Examination?',
		options: [
			{ value: '', text: '' },
			{ value: 'inspector-1', text: 'Inspector 1' },
			{ value: 'inspector-2', text: 'Inspector 2' },
			{ value: 'inspector-3', text: 'Inspector 3' },
			{ value: 'inspector-4', text: 'Inspector 4' }
		],
		fieldName: 'examiningInspector2',
		url: 'examining-inspector-2',
		title: 'Examining Inspector 2',
		validators: [new RequiredValidator('Input Examining Inspector 2')]
	},
	examiningInspector3: {
		type: COMPONENT_TYPES.SELECT,
		question: 'Which Inspector is assigned for Examination?',
		options: [
			{ value: '', text: '' },
			{ value: 'inspector-1', text: 'Inspector 1' },
			{ value: 'inspector-2', text: 'Inspector 2' },
			{ value: 'inspector-3', text: 'Inspector 3' },
			{ value: 'inspector-4', text: 'Inspector 4' }
		],
		fieldName: 'examiningInspector3',
		url: 'examining-inspector-3',
		title: 'Examining Inspector 3',
		validators: [new RequiredValidator('Input Examining Inspector 3')]
	},
	qaInspector1: {
		type: COMPONENT_TYPES.SELECT,
		question: 'Which Inspector is assigned for QA?',
		options: [
			{ value: '', text: '' },
			{ value: 'inspector-1', text: 'Inspector 1' },
			{ value: 'inspector-2', text: 'Inspector 2' },
			{ value: 'inspector-3', text: 'Inspector 3' },
			{ value: 'inspector-4', text: 'Inspector 4' }
		],
		fieldName: 'qaInspector1',
		url: 'qa-inspector-1',
		title: 'QA Inspector 1',
		validators: [new RequiredValidator('Input QA Inspector 1')],
		inputAttributes: { 'data-cy': 'inspector-qa-1' }
	},
	qaInspector2: {
		type: COMPONENT_TYPES.SELECT,
		question: 'Which Inspector is assigned for QA?',
		options: [
			{ value: '', text: '' },
			{ value: 'inspector-1', text: 'Inspector 1' },
			{ value: 'inspector-2', text: 'Inspector 2' },
			{ value: 'inspector-3', text: 'Inspector 3' },
			{ value: 'inspector-4', text: 'Inspector 4' }
		],
		fieldName: 'qaInspector2',
		url: 'qa-inspector-2',
		title: 'QA Inspector 2',
		validators: [new RequiredValidator('Input QA Inspector 2')],
		inputAttributes: { 'data-cy': 'inspector-qa-2' }
	},
	qaInspector3: {
		type: COMPONENT_TYPES.SELECT,
		question: 'Which Inspector is assigned for QA?',
		options: [
			{ value: '', text: '' },
			{ value: 'inspector-1', text: 'Inspector 1' },
			{ value: 'inspector-2', text: 'Inspector 2' },
			{ value: 'inspector-3', text: 'Inspector 3' },
			{ value: 'inspector-4', text: 'Inspector 4' }
		],
		fieldName: 'qaInspector3',
		url: 'qa-inspector-3',
		title: 'QA Inspector 3',
		validators: [new RequiredValidator('Input QA Inspector 3')],
		inputAttributes: { 'data-cy': 'inspector-qa-3' }
	},
	//gateway 1
	noticeOfIntentionPublishDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When was the Notice of Intention published?',
		fieldName: 'noticeOfIntention',
		url: 'notice-of-intention-publish-date',
		title: 'Notice of Intention publish date',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'notice-of-intention-publish-date' }
	},
	gateway1ExpectedDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'What is the expected Gateway 1 date?',
		fieldName: 'expectedGateway1Date',
		url: 'expected-gateway-1-date',
		title: 'Gateway 1 expected date',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'expected-gateway-1-date' }
	},
	gateway1ActualDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When was Gateway 1 completed?',
		fieldName: 'completedGateway1Date',
		url: 'completed-gateway-1-date',
		title: 'Gateway 1 actual date',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'completed-gateway-1-date' }
	},
	slaSentDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When was the SLA sent?',
		fieldName: 'slaSentDate',
		url: 'sla-sent-date',
		title: 'SLA sent date',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'sla-sent-date' }
	},
	slaReceivedDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When was the SLA received?',
		fieldName: 'slaReceivedDate',
		url: 'sla-received-date',
		title: 'SLA received date',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'sla-received-date' }
	},
	dsaCheck: {
		type: COMPONENT_TYPES.RADIO,
		question: 'Does the LPA have a Data Sharing Agreement (DSA)?',
		fieldName: 'dsaChecked',
		url: 'dsa-checked',
		title: 'Data Sharing Agreement (DSA) check',
		options: [
			{ value: 'yes', text: 'Yes' },
			{ value: 'no', text: 'No' }
		],
		validators: [new RequiredValidator('Select an option')]
	},
	programmeOfficerDetails: {
		type: CUSTOM_COMPONENTS.CUSTOM_MULTI_FIELD_INPUT,
		inputFields: [
			{
				type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
				fieldName: 'programmeOfficerFirstName',
				label: 'First name',
				title: 'Programme officer first name',
				attributes: { 'data-cy': 'programme-officer-first-name' }
			},
			{
				type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
				fieldName: 'programmeOfficerLastName',
				label: 'Last name',
				title: 'Programme Officer last name',
				attributes: { 'data-cy': 'programme-officer-last-name' }
			},
			{
				type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
				fieldName: 'programmeOfficerEmail',
				label: 'Email address',
				title: 'Programme Officer email address',
				attributes: { 'data-cy': 'programme-officer-email' }
			}
		],
		validators: [
			new MultiFieldInputValidator({
				fields: [
					{
						fieldName: 'programmeOfficerFirstName',
						validators: [new RequiredValidator('Input a first name')]
					},
					{
						fieldName: 'programmeOfficerLastName',
						validators: [new RequiredValidator('Input a last name')]
					},
					{
						fieldName: 'programmeOfficerEmail',
						validators: [new RequiredValidator('Input an email address')]
					}
				]
			})
		],
		question: 'Programme Officer details',
		fieldName: 'programmeOfficerDetails',
		url: 'programme-officer',
		title: 'Programme Officer details'
	},
	//gateway 2
	gateway2ExpectedDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'What is the expected Gateway 2 date?',
		fieldName: 'expectedDate',
		url: 'gateway-2-expected-date',
		title: 'Gateway 2 expected date',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'gateway-2-expected-date' }
	},
	gateway2ActualDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When was Gateway 2 completed?',
		fieldName: 'actualDate',
		url: 'gateway-2-actual-date',
		title: 'Gateway 2 actual date',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'gateway-2-actual-date' }
	},
	gateway2ValidDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'What is the Gateway 2 valid date?',
		fieldName: 'validDate',
		url: 'gateway-2-valid-date',
		title: 'Gateway 2 valid date',
		validators: [new DateValidator(' a valid date')],
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
		url: 'assessor-gateway-2',
		title: 'Gateway 2 assessor name',
		validators: [new RequiredValidator('Select a name')],
		inputAttributes: { 'data-cy': 'gateway-2-assessor' }
	},
	assessorDateOfAppointment: {
		type: COMPONENT_TYPES.DATE,
		question: 'When was the Gateway 2 assessor appointed?',
		fieldName: 'assessorAppointmentDate',
		url: 'gateway-2-assessor-appointed',
		title: 'Assessor date of appointment',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'gateway-2-assessor-appointed' }
	},
	workshopDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When is the Gateway 2 workshop?',
		fieldName: 'workshopDate',
		url: 'gateway-2-workshop-date',
		title: 'Workshop date',
		validators: [new DateValidator(' a valid date')],
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
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'gateway-2-report-issued-date' }
	},
	reportPublishedDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When was the report published by the LPA?',
		fieldName: 'reportPublishedByLPA',
		url: 'gateway-2-report-published-date',
		title: 'Report published by LPA date',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'gateway-2-report-published-date' }
	},
	//gateway 3
	gateway3ExpectedDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'What is the expected Gateway 3 date?',
		fieldName: 'expectedDate',
		url: 'gateway-3-expected-date',
		title: 'Gateway 3 expected date',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'gateway-3-expected-date' }
	},
	gateway3ActualDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When was Gateway 3 completed?',
		fieldName: 'actualDate',
		url: 'gateway-3-actual-date',
		title: 'Gateway 3 actual date',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'gateway-3-actual-date' }
	},
	gateway3AssessorsName: {
		type: COMPONENT_TYPES.SELECT,
		question: 'Who is the Gateway 3 assessor?',
		options: [
			{ value: '', text: '' },
			{ value: 'assessor-1', text: 'Assessor 1' },
			{ value: 'assessor-2', text: 'Assessor 2' },
			{ value: 'assessor-3', text: 'Assessor 3' },
			{ value: 'assessor-4', text: 'Assessor 4' }
		],
		fieldName: 'assessorName',
		url: 'gateway-3-assessor-name',
		title: 'Gateway 3 assessor name',
		validators: [new RequiredValidator('Select a name')],
		inputAttributes: { 'data-cy': 'gateway-3-assessor' }
	},
	gateway3AssessorDateOfAppointment: {
		type: COMPONENT_TYPES.DATE,
		question: 'When was the Gateway 3 assessor appointed?',
		fieldName: 'assessorAppointmentDate',
		url: 'gateway-3-assessor-date-of-appointment',
		title: 'Gateway 3 assessor date of appointment',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'gateway-3-assessor-date-of-appointment' }
	},
	gateway3CompletionDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'What is the Gateway 3 completion date?',
		fieldName: 'completionDate',
		url: 'gateway-3-completion-date',
		title: 'Gateway 3 completion date',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'gateway-3-completion-date' }
	},
	// Examination
	expectedSubmissionForExaminationDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When is the expected examination date?',
		fieldName: 'expectedSubmissionForExaminationDate',
		url: 'examination-expected-submission-date',
		title: 'Expected submission date',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'examination-expected-submission-date' }
	},
	submissionForExaminationDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When is the actual examination date?',
		fieldName: 'submissionForExaminationDate',
		url: 'examination-actual-submission-date',
		title: 'Actual submission date',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'examination-actual-submission-date' }
	},
	examiningInspectorAppointmentDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When were the examining Inspectors appointed?',
		fieldName: 'examiningInspectorAppointmentDate',
		url: 'examination-examining-inspector-appointment-date',
		title: 'Examining Inspector(s) appointment date',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'examination-examining-inspector-appointment-date' }
	},
	letterSentToMHCLGDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When was the 48-hour protocol letter sent to MHCLG?',
		fieldName: 'letterSentToMHCLGDate',
		url: 'letter-sent-to-mhclg-date',
		title: 'Letter sent to MHCLG date',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'letter-sent-to-mhclg-date' }
	},
	letterIssueDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When was the letter sent to the LPA?',
		fieldName: 'letterIssueDate',
		url: 'letter-issue-date',
		title: 'Letter issue date',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'letter-issue-date' }
	},
	qaDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'What is the date of QA?',
		fieldName: 'QADate',
		url: 'qa-date',
		title: 'QA date',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'qa-date' }
	},
	sentToPanelDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When was the report sent to the panel?',
		fieldName: 'reportSentToPanelDate',
		url: 'report-sent-to-panel-date',
		title: 'Sent to panel date',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'report-sent-to-panel-date' }
	},
	panelResponseSentToInspector: {
		type: COMPONENT_TYPES.DATE,
		question: 'When did the panel send its QA response to the Inspector?',
		fieldName: 'panelResponseToInspectorDate',
		url: 'panel-response-to-inspector-date',
		title: 'QA panel response sent to Inspector',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'rpanel-response-to-inspector-date' }
	},
	factCheckDateReceivedFromInspector: {
		type: COMPONENT_TYPES.DATE,
		question: 'When did the Inspector issue the Fact Check?',
		fieldName: 'factCheckDateReceivedFromInspector',
		url: 'fact-check-date-received-from-inspector',
		title: 'Fact Check date received from Inspector',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'fact-check-date-received-from-inspector' }
	},
	factCheckDueDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When is the Fact Check expected to be sent to the LPA?',
		fieldName: 'factCheckDueDate',
		url: 'fact-check-due-date',
		title: 'Fact Check due date',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'fact-check-due-date' }
	},
	factCheckActualDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When was the Fact Check actually sent to the LPA?',
		fieldName: 'factCheckActualDate',
		url: 'fact-check-actual-date',
		title: 'Fact Check actual date',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'fact-check-actual-date' }
	},
	factCheckReceivedBackFromLPADate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When was the Fact Check returned?',
		fieldName: 'factCheckReceivedBackFromLPADate',
		url: 'fact-check-received-back-from-lpa-date',
		title: 'Fact Check received back from LPA',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'fact-check-received-back-from-lpa-date' }
	},
	finalReportIssueDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When was the final report issued?',
		fieldName: 'finalReportIssueDate',
		url: 'final-report-issue-date',
		title: 'Final report issue date',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'final-report-issue-date' }
	},
	planPauseStartDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When did the plan pause start?',
		fieldName: 'planPauseStartDate',
		url: 'plan-pause-start-date',
		title: 'Plan pause date',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'plan-pause-start-date' }
	},
	planPauseEndDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When did the plan pause end?',
		fieldName: 'planPauseEndDate',
		url: 'plan-pause-end-date',
		title: 'Plan pause end date',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'plan-pause-end-date' }
	},
	withdrawnDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When was the plan withdrawn?',
		fieldName: 'withdrawnDate',
		url: 'withdrawn-date',
		title: 'Withdrawn date',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'withdrawn-date-date' }
	},
	isSound: {
		type: COMPONENT_TYPES.BOOLEAN,
		options: [
			{
				text: 'Sound',
				value: 'yes',
				attributes: { 'data-cy': 'answer-yes' }
			},
			{
				text: 'Unsound',
				value: 'no',
				attributes: { 'data-cy': 'answer-no' }
			}
		],
		question: 'Was the plan found to be sound or unsound?',
		fieldName: 'isSound',
		url: 'is-sound',
		title: 'Sound / unsound',
		validators: [new RequiredValidator('Please select an option')],
		inputAttributes: { 'data-cy': 'is-sound' }
	},
	soundUnsoundDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When was the plan confirmed as sound or unsound?',
		fieldName: 'soundUnsoundDate',
		url: 'sound-unsound-date',
		title: 'Sound / unsound date',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'sound-unsound-date' }
	},
	adoptionDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When was the plan adopted?',
		fieldName: 'adoptionDate',
		url: 'adoption-date',
		title: 'Adoption date',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'adoption-date-date' }
	},
	approvedForCILDate: {
		type: COMPONENT_TYPES.DATE,
		question: 'When was the plan approved for CIL?',
		fieldName: 'approvedForCILDate',
		url: 'approved-for-cil-date',
		title: 'Approved for CIL date',
		validators: [new DateValidator(' a valid date')],
		inputAttributes: { 'data-cy': 'approved-for-cil-date' }
	}
};

export const questions = createQuestions(
	caseQuestions,
	allQuestionClasses,
	{},
	{ continueButtonText: 'Save and continue' }
);

questions.examinationWebsite.formatAnswerForSummary = function (sectionSegment: string, journey: any, answer: string) {
	// Prepend https:// to the answer if it doesn't already start with http:// or https://
	const href = answer && !/^https?:\/\//i.test(answer) ? `https://${answer}` : answer;

	const value = answer
		? `<a href="${href}" class="govuk-link" rel="noreferrer noopener" target="_blank">${answer}</a>`
		: this.notStartedText;
	return [{ key: this.title, value, action: this.getAction(sectionSegment, journey, answer) }];
};
