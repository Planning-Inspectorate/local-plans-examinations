import type { DateAnswer } from '../../types/date.ts';

type Gateway1DateAnswer = {
	row: string;
	heading: string;
	fieldName: string;
	path: string;
	seedDate: string;
	input: DateAnswer;
	display: string;
};

export const gateway1DateAnswers = {
	noticeOfIntention: {
		row: 'Notice of Intention publish date',
		heading: 'When was the Notice of Intention published?',
		fieldName: 'noticeOfIntention',
		path: 'notice-of-intention-publish-date',
		seedDate: '2026-05-01T12:00:00.000Z',
		input: { day: '1', month: '5', year: '2026' },
		display: '1 May 2026'
	},
	estimatedGateway1Date: {
		row: 'Gateway 1 estimated date',
		heading: 'What is the estimated Gateway 1 date?',
		fieldName: 'estimatedGateway1Date',
		path: 'estimated-gateway-1-date',
		seedDate: '2026-06-01T12:00:00.000Z',
		input: { day: '1', month: '6', year: '2026' },
		display: '1 June 2026'
	},
	completedGateway1Date: {
		row: 'Gateway 1 actual date',
		heading: 'When was Gateway 1 completed?',
		fieldName: 'completedGateway1Date',
		path: 'completed-gateway-1-date',
		seedDate: '2026-07-01T12:00:00.000Z',
		input: { day: '1', month: '7', year: '2026' },
		display: '1 July 2026'
	},
	slaSentDate: {
		row: 'SLA sent date',
		heading: 'When was the SLA sent?',
		fieldName: 'slaSentDate',
		path: 'sla-sent-date',
		seedDate: '2026-08-01T12:00:00.000Z',
		input: { day: '1', month: '8', year: '2026' },
		display: '1 August 2026'
	},
	slaReceivedDate: {
		row: 'SLA received date',
		heading: 'When was the SLA received?',
		fieldName: 'slaReceivedDate',
		path: 'sla-received-date',
		seedDate: '2026-09-01T12:00:00.000Z',
		input: { day: '1', month: '9', year: '2026' },
		display: '1 September 2026'
	}
} as const satisfies Record<string, Gateway1DateAnswer>;

export const gateway1DsaAnswer = {
	row: 'Digital Sharing Agreement (DSA) check',
	path: 'dsa-checked',
	value: 'yes',
	display: 'Yes',
	updatedValue: 'no',
	updatedDisplay: 'No'
} as const;

export const updatedNoticeOfIntention = {
	input: { day: '15', month: '10', year: '2026' },
	display: '15 October 2026'
} as const;

export const gateway1ExpectedAnswers = [
	...Object.values(gateway1DateAnswers).map(({ row, display }) => ({ row, display })),
	{ row: gateway1DsaAnswer.row, display: gateway1DsaAnswer.display }
];
