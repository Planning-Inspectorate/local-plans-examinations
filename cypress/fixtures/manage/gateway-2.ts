import type { DateAnswer } from '../../types/date.ts';

type Gateway2DateAnswer = {
	row: string;
	heading: string;
	fieldName: string;
	path: string;
	seedDate: string;
	input: DateAnswer;
	display: string;
};

export const gateway2DateAnswers = {
	gateway2EstimatedDate: {
		row: 'Gateway 2 estimated date',
		heading: 'What is the estimated Gateway 2 date?',
		fieldName: 'estimatedDate',
		path: 'gateway-2-estimated-date',
		seedDate: '2026-06-01T12:00:00.000Z',
		input: { day: '1', month: '6', year: '2026' },
		display: '1 June 2026'
	},
	gateway2ActualDate: {
		row: 'Gateway 2 actual date',
		heading: 'When was Gateway 2 completed?',
		fieldName: 'actualDate',
		path: 'gateway-2-actual-date',
		seedDate: '2026-07-01T12:00:00.000Z',
		input: { day: '1', month: '7', year: '2026' },
		display: '1 July 2026'
	},
	gateway2ValidDate: {
		row: 'Gateway 2 valid date',
		heading: 'What is the Gateway 2 valid date?',
		fieldName: 'validDate',
		path: 'gateway-2-valid-date',
		seedDate: '2026-08-01T12:00:00.000Z',
		input: { day: '1', month: '8', year: '2026' },
		display: '1 August 2026'
	},
	assessorDateOfAppointment: {
		row: 'Assessor date of appointment',
		heading: 'When was the Gateway 2 assessor appointed?',
		fieldName: 'assessorAppointmentDate',
		path: 'gateway-2-assessor-appointed',
		seedDate: '2026-09-01T12:00:00.000Z',
		input: { day: '1', month: '9', year: '2026' },
		display: '1 September 2026'
	},
	workshopDate: {
		row: 'Workshop date',
		heading: 'When is the Gateway 2 workshop?',
		fieldName: 'workshopDate',
		path: 'gateway-2-workshop-date',
		seedDate: '2026-09-01T12:00:00.000Z',
		input: { day: '1', month: '9', year: '2026' },
		display: '1 September 2026'
	},
	reportIssuedDate: {
		row: 'Report issued date',
		heading: 'When was the report issued?',
		fieldName: 'reportIssuedDate',
		path: 'gateway-2-report-issued-date',
		seedDate: '2026-09-01T12:00:00.000Z',
		input: { day: '1', month: '9', year: '2026' },
		display: '1 September 2026'
	},
	reportPublishedDate: {
		row: 'Report published by LPA date',
		heading: 'When was the report published by the LPA?',
		fieldName: 'reportPublishedByLpa',
		path: 'gateway-2-report-published-date',
		seedDate: '2026-09-01T12:00:00.000Z',
		input: { day: '1', month: '9', year: '2026' },
		display: '1 September 2026'
	}
} as const satisfies Record<string, Gateway2DateAnswer>;

export const gateway2AssessorAnswer = {
	row: 'Gateway 2 assessor name',
	path: 'gateway-2-assessor',
	assessor1: 'Assessor 1',
	assessor1Select: '1',
	updatedAssessor: 'Assessor 2',
	updatedAssessorSelect: '2',
	display: 'Assessor 1'
} as const;

export const workshopVenueAnswer = {
	row: 'Workshop venue',
	path: 'gateway-2-workshop-venue',
	heading: 'What is the venue for the Gateway 2 workshop?',
	value: 'Workshop venue name',
	display: 'Workshop venue'
} as const;

export const updatedWorkshopVenueAnswer = {
	row: 'Workshop venue',
	path: 'gateway-2-workshop-venue',
	heading: 'What is the venue for the Gateway 2 workshop?',
	value: 'Updated Workshop Venue'
} as const;

export const updatedGateway2EstimatedDateAnswer = {
	input: { day: '15', month: '10', year: '2026' },
	display: '15 October 2026'
} as const;

export const gateway2ExpectedAnswers = [
	...Object.values(gateway2DateAnswers).map(({ row, display }) => ({ row, display })),
	{ row: gateway2AssessorAnswer.row, display: gateway2AssessorAnswer.display },
	{ row: workshopVenueAnswer.row, display: workshopVenueAnswer.display }
];
