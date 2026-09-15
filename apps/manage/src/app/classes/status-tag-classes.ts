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
	const activeGateway2Documents = gateway2Documents.filter((doc) => !doc.isDeleted);
	const hasGateway2Report = activeGateway2Documents.some((doc) => doc.documentSetId === DOCUMENT_SET_ID.G2_REPORT);
	const hasGateway2SubmissionDocuments = activeGateway2Documents.some(
		(doc) => doc.documentSetId !== DOCUMENT_SET_ID.G2_REPORT
	);

	const resolveStatus = (statusText: string) => {
		return {
			headerStatusText: statusText,
			headerStatusClasses: getPlanStatusClasses(statusText)
		};
	};

	if (hasGateway2Report) {
		return resolveStatus('GW3 pending');
	}

	if (gateway2Data?.workshopDate && gateway2Data.workshopDate < dateNow) {
		return resolveStatus('GW2 report');
	}

	if (gateway2Data?.workshopVenue && gateway2Data.workshopDate && gateway2Data.workshopDate > dateNow) {
		return resolveStatus('GW2 workshop confirmed');
	}

	if (hasGateway2SubmissionDocuments) {
		return resolveStatus('GW2 received');
	}

	if (gateway1Data?.slaReceivedDate) {
		return resolveStatus('GW2 pending');
	}

	return resolveStatus('Awaiting SLA');
}
