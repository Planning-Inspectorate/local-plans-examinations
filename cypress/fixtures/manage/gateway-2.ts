import type { DateAnswer } from '../../types/date.ts';

type Gateway2DateAnswer = {
	row: string;
	heading: string;
	section: string;
	fieldName: string;
	path: string;
	seedDate: string;
	input: DateAnswer;
	display: string;
};

export const gateway2DateAnswers = {
	gateway2ExpectedDate: {
		row: 'Expected',
		heading: 'What is the expected Gateway 2 date?',
		section: 'gateway-2',
		fieldName: 'expectedDate',
		path: 'gateway-2-expected-date',
		seedDate: '2026-06-01T12:00:00.000Z',
		input: { day: '1', month: '6', year: '2026' },
		display: '1 June 2026'
	},
	gateway2ActualDate: {
		row: 'Submission received',
		heading: 'When was Gateway 2 completed?',
		section: 'gateway-2',
		fieldName: 'actualDate',
		path: 'gateway-2-actual-date',
		seedDate: '2026-07-01T12:00:00.000Z',
		input: { day: '1', month: '7', year: '2026' },
		display: '1 July 2026'
	},
	gateway2ValidDate: {
		row: 'Gateway 2 valid date',
		heading: 'What is the Gateway 2 valid date?',
		section: 'gateway-2',
		fieldName: 'validDate',
		path: 'gateway-2-valid-date',
		seedDate: '2026-08-01T12:00:00.000Z',
		input: { day: '1', month: '8', year: '2026' },
		display: '1 August 2026'
	},
	assessorDateOfAppointment: {
		row: 'Appointed',
		heading: 'When was the Gateway 2 assessor appointed?',
		section: 'gateway-2',
		fieldName: 'assessorAppointmentDate',
		path: 'gateway-2-assessor-appointed',
		seedDate: '2026-09-01T12:00:00.000Z',
		input: { day: '1', month: '9', year: '2026' },
		display: '1 September 2026'
	},
	reportPublishedDate: {
		row: 'Report published by LPA date',
		heading: 'When was the report published by the LPA?',
		section: 'report',
		fieldName: 'reportPublishedByLPA',
		path: 'gateway-2-report-published-date',
		seedDate: '2026-09-01T12:00:00.000Z',
		input: { day: '1', month: '9', year: '2026' },
		display: '1 September 2026'
	}
} as const satisfies Record<string, Gateway2DateAnswer>;

export const gateway2AssessorAnswer = {
	row: 'Assessor',
	path: 'assessor-gateway-2',
	heading: 'Who is the Gateway 2 assessor?',
	assessor1: 'Assessor 1',
	assessor2: 'Assessor 2',
	display: 'Assessor 1',
	inputField: 'assessorName',
	boxListField: 'assessorName__listbox'
} as const;

export const gateway2Report = {
	row: 'Issue Gateway 2 report',
	heading: 'Upload Gateway 2 report',
	fieldName: 'gateway2Report',
	path: 'gateway-2-report',
	caption: 'Issue report',
	fileName: 'test-document.pdf',
	validationMessage: 'Please upload your Gateway 2 report'
} as const;

export const gateway2WorkshopDocuments = {
	row: 'Workshop documents',
	heading: 'Upload workshop documents',
	fieldName: 'gateway2WorkshopDocuments',
	path: 'gateway-2-workshop-documents',
	fileName: 'test-document.pdf'
} as const;

export const updatedGateway2ExpectedDateAnswer = {
	input: { day: '15', month: '10', year: '2026' },
	display: '15 October 2026'
} as const;

export const workshopSetUp = {
	workshopDateAndTime: {
		section: 'set-up-workshop/workshop',
		heading: 'Gateway 2 workshop date and time',
		fieldNameDate: 'workshopDate-1',
		fieldNameTime: 'workshopTime-1',
		path: 'gateway-2-workshop-date-and-time-1',
		inputDate: { day: '10', month: '10', year: '2026' },
		inputTime: { hour: '14', minute: '30' },
		display: '10 October 2026',
		displayTime: '14:30',
		row: 'Workshop date',
		rowTime: 'Workshop start time'
	},
	expectedNumberOfDays: {
		section: 'set-up-workshop/workshop',
		heading: 'Do you know the expected number of days to carry out the workshop?',
		fieldNameRadio: 'workshopExpectedDaysKnown-1',
		fieldNameDays: 'workshopExpectedDaysKnown-1_workshopExpectedDays',
		path: 'gateway-2-workshop-expected-days-1',
		inputRadio: 'yes',
		inputDays: '1',
		updatedInputDays: '2',
		row: 'Do you know the estimated number of days?',
		rowNumberOfDays: 'Estimated number of days',
		display: 'yes',
		displayNumberOfDays: '1',
		updatedDisplayNumberOfDays: '2'
	},
	workshopRemoteOrInPerson: {
		section: 'set-up-workshop/workshop',
		heading: 'Is the workshop in-person, hybrid or remote?',
		fieldNameRadio: 'workshopLocationType-1',
		path: 'gateway-2-location-type-1',
		inputRadio: 'hybrid',
		display: 'hybrid',
		row: 'Gateway 2 location type'
	},
	workshopAddressKnown: {
		section: 'set-up-workshop/workshop',
		heading: 'Do you know the address of where the workshop will take place?',
		fieldName: 'workshopLocationKnown-1',
		path: 'gateway-2-workshop-location-known-1',
		inputRadio: 'yes',
		display: 'Yes',
		row: 'Gateway 2 location known'
	},
	workshopVenueAddress: {
		section: 'set-up-workshop/workshop',
		heading: 'Workshop venue address',
		fieldNameVenueName: 'gateway-2-workshop-venue-name',
		fieldNameAddressLine1: 'gateway-2-workshop-address-line-1',
		fieldNameTownOrCity: 'gateway-2-workshop-town-or-city',
		fieldNamePostcode: 'gateway-2-workshop-postcode',
		path: 'gateway-2-workshop-venue-address-1',
		values: {
			venueName: 'The workshop venue',
			addressLine1: '10 workshop Rd',
			townOrCity: 'London',
			postcode: 'N1 10'
		},
		row: 'Gateway 2 workshop venue address',
		display: 'The workshop venue'
	},
	workshopMeetingLinkKnown: {
		section: 'set-up-workshop/workshop',
		heading: 'Do you have a remote meeting link?',
		fieldName: 'remoteMeetingLinkKnown-1',
		path: 'gateway-2-remote-meeting-link-known-1',
		inputRadio: 'yes',
		display: 'Yes',
		row: 'Gateway 2 remote meeting link known'
	},
	workshopMeetingLink: {
		section: 'set-up-workshop/workshop',
		heading: 'What is the remote meeting link?',
		fieldName: 'remoteMeetingLink-1',
		path: 'gateway-2-remote-meeting-link-1',
		input: 'linkToMeeting',
		display: '\n          LinkToMeeting\n        ',
		row: 'Remote meeting link'
	}
};

export const gateway2ExpectedAnswers = [
	...Object.values(gateway2DateAnswers).map(({ row, display }) => ({ row, display })),
	{ row: gateway2AssessorAnswer.row, display: gateway2AssessorAnswer.display }
];

export const workshopSetupExpectedAnswers = [
	...Object.values(workshopSetUp).map(({ row, display }) => ({ row, display })),
	{ row: workshopSetUp.workshopDateAndTime.rowTime, display: workshopSetUp.workshopDateAndTime.displayTime },
	{
		row: workshopSetUp.expectedNumberOfDays.rowNumberOfDays,
		display: workshopSetUp.expectedNumberOfDays.displayNumberOfDays
	}
];
