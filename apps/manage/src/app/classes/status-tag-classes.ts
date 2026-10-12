import type {
	DocumentModel,
	Gateway1InfoModel,
	Gateway2InfoModel,
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

type ExaminationStage = {
	examiningInspector1?: string;
	planPauseStartDate?: string;
	planPauseEndDate?: string;
	examiningInspectorAppointmentDate?: string;
	submissionForExaminationDate?: string;
	QADate?: string;
	factCheckDateReceivedFromInspector?: string;
	factCheckActualDate: string;
	finalReportIssueDate?: string;
	adoptionDate?: string;
};

export const resolveExaminationStage = (examinationStatus?: ExaminationStage) => {
	if (!examinationStatus) return;

	const isAtExamStage = Object.keys(examinationStatus as ExaminationStage).some(
		(key) => examinationStatus[key as keyof ExaminationStage] != null
	);

	if (!isAtExamStage) return;

	const isPaused = examinationStatus.planPauseStartDate != null && examinationStatus.planPauseEndDate == null;
	if (isPaused) return 'Paused';

	const stages = {
		submissionForExaminationDate: 'submission received',
		examiningInspectorAppointmentDate: 'Exam in progress',
		QADate: 'QA',
		factCheckDateReceivedFromInspector: 'Fact check',
		factCheckActualDate: 'Fact check',
		finalReportIssueDate: 'Report Issued',
		adoptionDate: 'Plan adopted'
	};
	const stageKeys = Object.keys(stages) as (keyof typeof stages)[];

	const resolvedStageValue = stageKeys
		.filter((key) => examinationStatus[key] != null)
		.sort(
			(a, b) =>
				new Date(examinationStatus[a]!).getTime() - new Date(examinationStatus[b]!).getTime() ||
				stageKeys.indexOf(a) - stageKeys.indexOf(b)
		);

	const resolvedStage = resolvedStageValue.pop();
	if (!resolvedStage) return 'Submission pending';

	return stages[resolvedStage];
};

export function resolveCaseHeaderStatus(
	gateway2Documents: DocumentModel[],
	gateway3Documents: DocumentModel[],
	gateway1Data: Gateway1InfoModel | null,
	gateway2Data: Gateway2InfoModel | null,
	gateway3Submissions: Gateway3SubmissionModel[],
	examinationStatus?: ExaminationStage
) {
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

	const examStage = resolveExaminationStage(examinationStatus);

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

	if (examStage) {
		return resolveStatus(examStage);
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
