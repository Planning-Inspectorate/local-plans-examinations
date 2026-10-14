import type {
	DocumentModel,
	Gateway1InfoModel,
	Gateway2InfoModel,
	Gateway2WorkshopModel,
	Gateway3SubmissionModel
} from '@pins/local-plans-database/src/client/models.ts';
import { DOCUMENT_SET_ID } from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';
import { GATEWAY_3_DECISION_ID } from '@pins/local-plans-database/src/seed/static-data/ids/case.ts';
import { sortGateway3Submissions } from '../../util/util.ts';

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
	'Exam paused': 'govuk-tag--grey',
	'Plan adopted': 'govuk-tag--green',
	'Hearing pending': 'govuk-tag--blue',
	'Exam in progress': 'govuk-tag--blue',
	'Submission pending': 'govuk-tag--yellow',
	'Submission received': 'govuk-tag-green',
	'Report Issued': 'govuk-tag--blue',
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

const EXAMINATION_FIELDS = [
	['examiningInspector1', 'Exam in progress'],
	['examiningInspector2', 'Exam in progress'],
	['examiningInspector3', 'Exam in progress'],
	['qaInspector1', 'QA'],
	['qaInspector2', 'QA'],
	['qaInspector3', 'QA'],
	['planResponseToInspectorDate', 'Fact check'],
	['planPauseStartDate', null],
	['planPauseEndDate', null],
	['finalReportIssueDate', 'Report issued'],
	['adoptionDate', 'Plan adopted']
] as const;

export type ExaminationStage = Partial<Record<(typeof EXAMINATION_FIELDS)[number][0], string>>;

export const resolveExaminationStage = (
	status?: ExaminationStage | null,
	passDecisionGiven?: boolean
): string | null => {
	if (!passDecisionGiven || !status) return null;
	if (status.planPauseStartDate != null && status.planPauseEndDate == null) return 'Paused';
	const latest = EXAMINATION_FIELDS.findLast(([field, label]) => label && status[field] != null);

	if (!latest) return null;

	const [, label] = latest;

	return label;
};

type Gateway2ModelWithWorkshops = Gateway2InfoModel & { workshops: Gateway2WorkshopModel[] };

export type ResolvedCaseHeaderStatus = {
	headerStatusText: string;
	headerStatusClasses: string;
};

/**
 * Resolves the case header status based on the provided data from multiple gateways and examination statuses.
 *
 * @param {DocumentModel[]} gateway2Documents - An array of gateway 2 documents.
 * @param {DocumentModel[]} gateway3Documents - An array of gateway 3 documents.
 * @param {Gateway1InfoModel | null} gateway1Data - Data related to gateway 1, or null if not available.
 * @param {Gateway2ModelWithWorkshops | null} gateway2Data - Data related to gateway 2, including workshop information, or null if not available.
 * @param {Gateway3SubmissionModel[]} gateway3Submissions - An array of gateway 3 submission records.
 * @param {ExaminationStage | null} [examinationStatus] - The current examination stage status, or null if not provided.
 * @return {ResolvedCaseHeaderStatus} An object containing the resolved case header status text and corresponding CSS classes.
 */
export function resolveCaseHeaderStatus(
	gateway2Documents: DocumentModel[],
	gateway3Documents: DocumentModel[],
	gateway1Data: Gateway1InfoModel | null,
	gateway2Data: Gateway2ModelWithWorkshops | null,
	gateway3Submissions: Gateway3SubmissionModel[],
	examinationStatus: ExaminationStage | null
): ResolvedCaseHeaderStatus {
	const dateNow = new Date();
	const activeGateway2Documents = gateway2Documents.filter((doc) => !doc.isDeleted);
	const activeGateway3Documents = gateway3Documents.filter((doc) => !doc.isDeleted);

	const hasGateway2Report = activeGateway2Documents.some((doc) => doc.documentSetId === DOCUMENT_SET_ID.G2_REPORT);
	const hasGateway2SubmissionDocuments = activeGateway2Documents.some(
		(doc) => doc.documentSetId !== DOCUMENT_SET_ID.G2_REPORT
	);
	const gateway3Received = activeGateway3Documents.length > 0 && gateway3Submissions.some((s) => s.completionDate);
	const sortedSubmissions = sortGateway3Submissions(gateway3Submissions);
	const latestSubmission = sortedSubmissions.at(-1);
	const rejected = sortedSubmissions
		.filter(
			(submission) => submission.decision === GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED && submission.completionDate
		)
		.at(-1);
	const resubmissionRequired = !!rejected;
	const rejectedAt = rejected?.completionDate;

	const resubmissionReceived =
		rejected &&
		latestSubmission &&
		latestSubmission.id !== rejected.id &&
		latestSubmission.decision == null &&
		latestSubmission.completionDate == null &&
		rejectedAt &&
		activeGateway3Documents.some((document) => document.createdAt > rejectedAt);

	const passDecisionGiven =
		latestSubmission?.completionDate && latestSubmission.decision == GATEWAY_3_DECISION_ID.PROCEED_TO_EXAMINATION
			? true
			: false;

	const resolveStatus = (statusText: string) => {
		return {
			headerStatusText: statusText,
			headerStatusClasses: getPlanStatusClasses(statusText)
		};
	};

	const examStage = resolveExaminationStage(examinationStatus, passDecisionGiven);

	if (passDecisionGiven && examStage) {
		return resolveStatus(examStage);
	}

	if (passDecisionGiven) {
		return resolveStatus('Submission pending');
	}

	if (resubmissionReceived) {
		return resolveStatus('GW3 received');
	}

	if (resubmissionRequired) {
		return resolveStatus('GW3 pending');
	}

	if (gateway3Received) {
		return resolveStatus('GW3 received');
	}

	if (hasGateway2Report) {
		return resolveStatus('GW3 pending');
	}

	if (
		gateway2Data?.workshops &&
		gateway2Data?.workshops.length > 0 &&
		gateway2Data?.workshops.every((workshop) => workshop.workshopDate && workshop.workshopDate < dateNow)
	) {
		return resolveStatus('GW2 report');
	}
	if (
		gateway2Data?.workshops &&
		gateway2Data?.workshops.length > 0 &&
		gateway2Data?.workshops.every(
			(workshop) =>
				(workshop.workshopLocationType || workshop.workshopVenueName) &&
				workshop.workshopDate &&
				workshop.workshopDate > dateNow
		)
	) {
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
