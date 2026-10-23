import type { DateAnswer } from '../../types/date.ts';

type Gateway3DateAnswer = {
	row: string;
	heading: string;
	fieldName: string;
	path: string;
	seedDate: string;
	input: DateAnswer;
	display: string;
	section: string;
};

export const gateway3DateAnswers = {
	gateway3ExpectedDate: {
		row: 'Expected',
		heading: 'What is the expected Gateway 3 date?',
		fieldName: 'expectedDate',
		path: 'gateway-3-expected-date',
		seedDate: '2026-07-21T12:00:00.000Z',
		input: { day: '21', month: '7', year: '2026' },
		display: '21 July 2026',
		section: 'gateway-3'
	},
	gateway3ActualDate: {
		row: 'Submission received',
		heading: 'When was Gateway 3 completed?',
		fieldName: 'actualDate',
		path: 'gateway-3-actual-date',
		seedDate: '2026-08-01T12:00:00.000Z',
		input: { day: '1', month: '8', year: '2026' },
		display: '1 August 2026',
		section: 'gateway-3'
	},
	gateway3AssessorDateAppointment: {
		row: 'Appointed',
		heading: 'When was the Gateway 3 assessor appointed?',
		fieldName: 'assessorAppointmentDate',
		path: 'gateway-3-assessor-date-of-appointment',
		seedDate: '2026-09-01T12:00:00.000Z',
		input: { day: '1', month: '9', year: '2026' },
		display: '1 September 2026',
		section: 'gateway-3'
	}
} as const satisfies Record<string, Gateway3DateAnswer>;

export const gateway3CompletionDate = {
	row: 'Gateway 3 completion date',
	heading: 'What is the Gateway 3 completion date?',
	fieldName: 'completionDate',
	path: 'gateway-3-completion-date',
	display: 'Not started',
	section: 'gateway-3-submission'
} as const;

export const gateway3AssessorAnswer = {
	row: 'Assessor',
	path: 'gateway-3-assessor-name',
	heading: 'Who is the Gateway 3 assessor?',
	assessor1: 'Assessor 1',
	assessor2: 'Assessor 2',
	display: 'Assessor 1',
	inputField: 'assessorName',
	boxListField: 'assessorName__listbox'
} as const;

export const gateway3ProgrammeOfficerAnswer = {
	row: 'Programme officer',
	path: 'programme-officer',
	heading: 'Programme Officer details',
	firstName: 'Albert',
	lastName: 'Einstien',
	email: 'gateway3.officer@test.com'
} as const;

export const gateway3ExaminationWebsite = {
	row: 'Examination website',
	heading: 'What is the address of the examination website?',
	fieldName: 'examinationWebsite',
	path: 'examination-website',
	display: 'Not started',
	value: 'www.gateway-3-example.com',
	href: 'https://www.gateway-3-example.com',
	unsavedValue: 'www.unsaved-gateway-3-example.com'
} as const;

export const gateway3DocumentsAnswer = {
	row: 'Gateway 3 documents',
	heading: 'Upload Gateway 3 report',
	fieldName: 'gateway3Documents',
	path: 'gateway-3-document',
	caption: 'Gateway 3 documents',
	fileName: 'test-document.pdf',
	fileName2: 'test-document.docx'
} as const;

export const gateway3DecisionAnswer = {
	row: 'Gateway 3 decision',
	path: 'gateway-3-decision'
} as const;

export const gateway3ReviewDocumentsAnswer = {
	row: 'Documents',
	path: 'gateway-3-review-documents',
	reviewLinkText: 'Review',
	noDocumentsDisplay: '0 document(s)',
	notAddedDisplay: 'Not provided',
	requiredSection: {
		id: 'required-documents',
		heading: 'Required information',
		description: 'You must add each of these documents as a link or an attachment before submitting.'
	},
	optionalSection: {
		id: 'optional-documents',
		heading: 'Optional documents',
		description: 'You can add these additional documents if they are relevant to your plan.'
	},
	errorSummaryTitle: 'There is a problem'
} as const;

export type Gateway3SubmissionDocument = {
	label: string;
	documentSetKey: string;
	fileName: string;
};

export const gateway3ExaminationWebsiteDocumentLabel = 'Examination website';

export const gateway3RequiredSubmissionDocuments = [
	{
		label: 'Proposed local plan intended for submission for examination',
		documentSetKey: 'G3_PROPOSED_LOCAL_PLAN',
		fileName: 'proposed-local-plan.pdf'
	},
	{
		label: 'Map of proposed local plan policies',
		documentSetKey: 'G3_MAP_OF_POLICIES',
		fileName: 'map-of-policies.pdf'
	},
	{
		label: 'Statement of compliance',
		documentSetKey: 'G3_STATEMENT_OF_COMPLIANCE',
		fileName: 'statement-of-compliance.pdf'
	},
	{
		label: 'Statement of soundness',
		documentSetKey: 'G3_STATEMENT_OF_SOUNDNESS',
		fileName: 'statement-of-soundness.pdf'
	},
	{
		label: 'Summary of consultation and engagement activities undertaken in preparing the proposed local plan',
		documentSetKey: 'G3_CONSULTATION_ENGAGEMENT_SUMMARY',
		fileName: 'consultation-engagement-summary.pdf'
	},
	{
		label: 'Summary of scoping consultation',
		documentSetKey: 'G3_SCOPING_CONSULTATION_SUMMARY',
		fileName: 'scoping-consultation-summary.pdf'
	},
	{
		label: 'Summary of consultation on proposed local plan content and evidence',
		documentSetKey: 'G3_CONSULTATION_CONTENT_EVIDENCE_SUMMARY',
		fileName: 'consultation-content-evidence-summary.pdf'
	},
	{
		label: 'Summary of consultation on proposed local plan',
		documentSetKey: 'G3_CONSULTATION_PROPOSED_PLAN_SUMMARY',
		fileName: 'consultation-proposed-plan-summary.pdf'
	},
	{
		label: 'Statement setting out practical arrangements',
		documentSetKey: 'G3_PRACTICAL_ARRANGEMENTS_STATEMENT',
		fileName: 'practical-arrangements-statement.pdf'
	}
] as const satisfies readonly Gateway3SubmissionDocument[];

export const gateway3OptionalSubmissionDocumentLabels = [
	'Copies of representations',
	'Supplementary plans statement',
	'Environmental report',
	'Statement of reasons for a determination that the proposed local plan is unlikely to have significant environmental effects',
	'Summary of representations relating to progress towards meeting prescribed requirements and the LPA response',
	'Summary of how Gateway 2 assessor issues have been addressed',
	'Statement explaining changes since proposed local plan consultation, reasons for those changes and any additional consultation',
	'Other documents'
] as const;

export const gateway3MissingDocumentError = (documentLabel: string) => `${documentLabel} document is required.`;

export const updatedGateway3ExpectedDateAnswer = {
	input: { day: '21', month: '11', year: '2026' },
	display: '21 November 2026'
} as const;

export const gateway3ExpectedAnswers = [
	...Object.values(gateway3DateAnswers).map(({ row, display }) => ({ row, display })),
	{ row: gateway3AssessorAnswer.row, display: gateway3AssessorAnswer.display },
	{ row: gateway3ExaminationWebsite.row, display: gateway3ExaminationWebsite.display },
	{ row: gateway3ReviewDocumentsAnswer.row, display: gateway3ReviewDocumentsAnswer.noDocumentsDisplay }
];
