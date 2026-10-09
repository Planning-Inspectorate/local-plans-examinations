import assert from 'node:assert';
import { describe, it } from 'node:test';
import { GATEWAY_3_DECISION_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';
import { getGateway3SubmissionState, sortGateway3Submissions } from './gateway-3-submission.ts';

describe('sortGateway3Submissions', () => {
	it('sorts completed submissions by completion date and leaves the blank active row last', () => {
		const resubmissionRequired = {
			decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED,
			completionDate: new Date('2026-08-01T12:00:00.000Z')
		};
		const proceedToExamination = {
			decision: GATEWAY_3_DECISION_ID.PROCEED_TO_EXAMINATION,
			completionDate: new Date('2026-09-01T12:00:00.000Z')
		};
		const activeSubmission = {
			decision: null,
			completionDate: null
		};
		const submissions = [activeSubmission, proceedToExamination, resubmissionRequired];

		assert.deepStrictEqual(sortGateway3Submissions(submissions), [
			resubmissionRequired,
			proceedToExamination,
			activeSubmission
		]);
		assert.deepStrictEqual(submissions, [activeSubmission, proceedToExamination, resubmissionRequired]);
	});
});

describe('getGateway3SubmissionState', () => {
	it('treats a blank active row after a resubmission decision as awaiting submission', () => {
		const decisionDate = new Date('2026-08-01T12:00:00.000Z');
		const state = getGateway3SubmissionState({
			actualDate: decisionDate,
			submissions: [
				{
					decision: null,
					completionDate: null
				},
				{
					decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED,
					completionDate: decisionDate
				}
			]
		});

		assert.equal(state.resubmissionAwaitingSubmission, true);
		assert.deepStrictEqual(state.latestSubmission, {
			decision: null,
			completionDate: null
		});
	});

	it('does not treat the row as awaiting submission after a newer Gateway 3 actual date', () => {
		const state = getGateway3SubmissionState({
			actualDate: new Date('2026-08-02T12:00:00.000Z'),
			submissions: [
				{
					decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED,
					completionDate: new Date('2026-08-01T12:00:00.000Z')
				},
				{
					decision: null,
					completionDate: null
				}
			]
		});

		assert.equal(state.resubmissionAwaitingSubmission, false);
	});
});
