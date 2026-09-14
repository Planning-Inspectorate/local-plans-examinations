import { DOCUMENT_SET_ID } from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';

const PLAN_STATUS_CLASS_MAP: Record<string, string> = {
	Submitted: 'govuk-tag--green',
	'In progress': 'govuk-tag--blue',
	Created: 'govuk-tag--green',

	// Current flow labels
	'Awaiting SLA': 'govuk-tag--yellow',
	'GW2 pending': 'govuk-tag--yellow',
	'GW2 received': 'govuk-tag--turquoise',
	'GW2 workshop confirmed': 'govuk-tag--blue',
	'GW2 report': 'govuk-tag--blue',
	'GW3 pending': 'govuk-tag--yellow',
	'GW3 received': 'govuk-tag--turquoise',
	Examination: 'govuk-tag--yellow',
	'Exam pending': 'govuk-tag--yellow',
	'Hearing pending': 'govuk-tag--blue',
	'Exam in progress': 'govuk-tag--blue',
	QA: 'govuk-tag--blue',
	'Fact check': 'govuk-tag--turquoise',
	Completed: 'govuk-tag--green',
	Paused: 'govuk-tag--grey',
	Withdrawn: 'govuk-tag--red',

	// Variant labels used in some journeys/views
	'GW2 submitted': 'govuk-tag--turquoise',
	'GW3 submitted': 'govuk-tag--turquoise',

	// Legacy labels kept for backwards compatibility with seeded/demo data
	'Awaiting Gateway 2': 'govuk-tag--yellow',
	'Gateway 2 With LPA': 'govuk-tag--yellow',
	'Gateway 2 Validation': 'govuk-tag--blue',
	'Awaiting signed SLA': 'govuk-tag--yellow',
	'Awaiting Gateway 2 submission': 'govuk-tag--yellow',
	'Gateway 2 workshop confirmed': 'govuk-tag--blue',
	'Gateway 2 report in progress': 'govuk-tag--blue',
	'Awaiting Gateway 3 submission': 'govuk-tag--yellow'
};

export function getPlanStatusClasses(statusText: string) {
	return PLAN_STATUS_CLASS_MAP[statusText] ?? 'govuk-tag--turquoise';
}

export function resolveCaseHeaderStatus(
	gateway1Data: {
		id: string;
		caseId: string;
		noticeOfIntention: Date | null;
		expectedGateway1Date: Date | null;
		completedGateway1Date: Date | null;
		slaSentDate: Date | null;
		slaReceivedDate: Date | null;
		dsaChecked: string | null;
	} | null,
	gateway2Data: {
		actualDate: Date | null;
		workshopVenue: string | null;
		workshopDate: Date | null;
		id: string;
		assessorName: string | null;
		caseId: string;
		expectedDate: Date | null;
		validDate: Date | null;
		assessorAppointmentDate: Date | null;
		reportIssuedDate: Date | null;
		reportPublishedByLPA: Date | null;
		workshopDocumentUploadedDate: Date | null;
	} | null,
	gateway2Documents: {
		createdAt: Date;
		name: string;
		caseId: string;
		guid: string;
		documentSetId: string;
		isDeleted: boolean;
		latestVersionId: number | null;
	}[]
) {
	const dateNow = new Date();
	let textAndClass = {
		headerStatusText: 'Awaiting SLA',
		headerStatusClasses: getPlanStatusClasses('Awaiting SLA')
	};

	if (gateway1Data?.slaReceivedDate) {
		textAndClass = {
			headerStatusText: 'GW2 pending',
			headerStatusClasses: getPlanStatusClasses('GW2 pending')
		};
	}

	if (
		gateway2Data?.actualDate &&
		gateway2Data.workshopVenue &&
		gateway2Data.workshopDate &&
		gateway2Data.workshopDate > dateNow
	) {
		textAndClass = {
			headerStatusText: 'GW2 workshop confirmed',
			headerStatusClasses: getPlanStatusClasses('GW2 workshop confirmed')
		};
	}

	if (
		gateway2Data?.workshopDate &&
		gateway2Data.workshopDate < dateNow &&
		!gateway2Documents.find((doc) => doc.documentSetId === DOCUMENT_SET_ID.G2_REPORT)
	) {
		textAndClass = {
			headerStatusText: 'GW2 report',
			headerStatusClasses: getPlanStatusClasses('GW2 report')
		};
	}

	if (gateway2Documents.length > 0) {
		textAndClass = {
			headerStatusText: 'GW2 received',
			headerStatusClasses: getPlanStatusClasses('GW2 received')
		};
	}

	if (gateway2Documents.find((doc) => doc.documentSetId === DOCUMENT_SET_ID.G2_REPORT)) {
		textAndClass = {
			headerStatusText: 'GW3 pending',
			headerStatusClasses: getPlanStatusClasses('GW3 pending')
		};
	}

	return textAndClass;
}
