import type { DateAnswer } from '../../types/date.ts';

type Gateway3DateAnswer = {
	row: string;
	heading: string;
	fieldName: string;
	path: string;
	seedDate: string;
	input: DateAnswer;
	display: string;
};

export const gateway3DateAnswers = {
	gateway3EstimatedDate: {
		row: 'Gateway 3 estimated date',
		heading: 'What is the estimated Gateway 3 date?',
		fieldName: 'estimatedDate',
		path: 'gateway-3-estimated-date',
		seedDate: '2026-07-21T12:00:00.000Z',
		input: { day: '21', month: '7', year: '2026' },
		display: '21 July 2026'
	},
	gateway3ActualDate: {
		row: 'Gateway 3 actual date',
		heading: 'When was Gateway 3 completed?',
		fieldName: 'actualDate',
		path: 'gateway-3-actual-date',
		seedDate: '2026-08-01T12:00:00.000Z',
		input: { day: '1', month: '8', year: '2026' },
		display: '1 August 2026'
	},
	gateway3AssessorDateAppointment: {
		row: 'Gateway 3 assessor date of appointment',
		heading: 'When was the Gateway 3 assessor appointed?',
		fieldName: 'assessorAppointmentDate',
		path: 'gateway-3-assessor-date-of-appointment',
		seedDate: '2026-09-01T12:00:00.000Z',
		input: { day: '1', month: '9', year: '2026' },
		display: '1 September 2026'
	},
	gateway3CompletionDate: {
		row: 'Gateway 3 completion date',
		heading: 'What is the Gateway 3 completion date?',
		fieldName: 'completionDate',
		path: 'gateway-3-completion-date',
		seedDate: '2026-12-01T12:00:00.000Z',
		input: { day: '1', month: '12', year: '2026' },
		display: '1 December 2026'
	}
} as const satisfies Record<string, Gateway3DateAnswer>;

export const gateway3AssessorAnswer = {
	row: 'Gateway 3 assessor name',
	path: 'gateway-3-assessor-name',
	heading: 'Who is the Gateway 3 assessor?',
	assessor1: 'Assessor 1',
	assessor2: 'Assessor 2',
	display: 'Assessor 1',
	inputField: 'assessorName',
	boxListField: 'assessorName__listbox'
} as const;

export const gateway3ProgrammeOfficerAnswer = {
	row: 'Programme Officer details',
	path: 'programme-officer',
	heading: 'Programme Officer details',
	firstName: 'Albert',
	lastName: 'Einstien',
	email: 'gateway3.officer@test.com'
} as const;

export const updatedGateway3EstimatedDateAnswer = {
	input: { day: '21', month: '11', year: '2026' },
	display: '21 November 2026'
} as const;

export const gateway3ExpectedAnswers = [
	...Object.values(gateway3DateAnswers).map(({ row, display }) => ({ row, display })),
	{ row: gateway3AssessorAnswer.row, display: gateway3AssessorAnswer.display }
];
