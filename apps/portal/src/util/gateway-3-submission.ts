import { GATEWAY_3_DECISION_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';

export type Gateway3SubmissionSummary = {
	decision: string | null;
	completionDate: Date | null;
};

type Gateway3InfoSubmissionState = {
	actualDate: Date | null;
	submissions?: Gateway3SubmissionSummary[] | null;
};

// Match the manage app ordering so the latest Gateway 3 submission is the
// active row, including the blank row created after a resubmission decision.
export function sortGateway3Submissions(submissions: Gateway3SubmissionSummary[]): Gateway3SubmissionSummary[] {
	return [...submissions].sort((a, b) => {
		if (!(a.completionDate || b.completionDate)) return 0;
		if (!a.completionDate) return 1;
		if (!b.completionDate) return -1;
		return a.completionDate.getTime() - b.completionDate.getTime();
	});
}

// A single gateway3Info.actualDate can outlive a rejected submission. When
// manage creates a blank resubmission row, keep Gateway 3 open until the LPA
// submits again and actualDate is newer than the rejected decision date.
export function getGateway3SubmissionState(gateway3Info: Gateway3InfoSubmissionState | null | undefined) {
	const submissions = sortGateway3Submissions(gateway3Info?.submissions ?? []);
	const latestSubmission = submissions.at(-1);
	const previousResubmissionRequired = submissions
		.slice(0, -1)
		.reverse()
		.find(
			(submission) => submission.decision === GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED && submission.completionDate
		);
	const previousCompletionDate = previousResubmissionRequired?.completionDate;
	const resubmissionAwaitingSubmission = Boolean(
		latestSubmission &&
		!latestSubmission.decision &&
		!latestSubmission.completionDate &&
		previousCompletionDate &&
		(!gateway3Info?.actualDate || gateway3Info.actualDate <= previousCompletionDate)
	);

	return {
		latestSubmission,
		resubmissionAwaitingSubmission
	};
}

export function isGateway3ResubmissionAwaitingSubmission(gateway3Info: Gateway3InfoSubmissionState | null | undefined) {
	return getGateway3SubmissionState(gateway3Info).resubmissionAwaitingSubmission;
}
