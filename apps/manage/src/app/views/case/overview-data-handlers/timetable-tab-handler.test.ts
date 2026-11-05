import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { GATEWAY_3_DECISION_ID } from '@pins/local-plans-database/src/seed/static-data/ids/case.ts';
import type { PageLoadContext } from './overview-page-load-handler.ts';
import { TimetableTabHandler } from './timetable-tab-handler.ts';

function createContext(records: Record<string, any> = {}, caseId = 'case-1') {
	const db = {
		gateway1Info: { findUnique: mock.fn(async () => records.gateway1Info ?? null) },
		gateway2Info: { findUnique: mock.fn(async () => records.gateway2Info ?? null) },
		gateway3Info: { findUnique: mock.fn(async () => records.gateway3Info ?? null) },
		examinationInfo: { findUnique: mock.fn(async () => records.examinationInfo ?? null) }
	};
	const next = mock.fn();
	const context = {
		res: { locals: {} },
		service: { db },
		journeyId: 'timetable',
		caseRecord: { id: caseId },
		next
	} as unknown as PageLoadContext;
	return { context, db, next };
}

describe('TimetableTabHandler', () => {
	it('keeps Gateway and Examination dates distinct when combining their records', async () => {
		const dates = Array.from({ length: 10 }, (_, day) => new Date(Date.UTC(2026, 0, day + 1)));
		const { context, db, next } = createContext({
			gateway1Info: { expectedGateway1Date: dates[0], completedGateway1Date: dates[1] },
			gateway2Info: { expectedDate: dates[2], actualDate: dates[3], reportIssuedDate: dates[4] },
			gateway3Info: { expectedDate: dates[5], actualDate: dates[6], submissions: [] },
			examinationInfo: {
				expectedSubmissionForExaminationDate: dates[7],
				submissionForExaminationDate: dates[8],
				letterIssueDate: dates[9]
			}
		});

		await new TimetableTabHandler().handle(context);

		const answers = context.res.locals.journeyResponse.answers;
		assert.deepEqual(
			[
				answers.expectedGateway1Date,
				answers.completedGateway1Date,
				answers.expectedDate,
				answers.actualDate,
				answers.reportIssuedDate,
				answers.gateway3ExpectedDate,
				answers.gateway3ActualDate,
				answers.expectedSubmissionForExaminationDate,
				answers.submissionForExaminationDate,
				answers.letterIssueDate
			],
			dates
		);
		for (const model of Object.values(db)) {
			assert.deepEqual(model.findUnique.mock.calls[0].arguments[0].where, { caseId: 'case-1' });
		}
		assert.equal(next.mock.callCount(), 1);
	});

	it('uses the proceed decision completion date and orders grouped workshop and hearing dates', async () => {
		const earlier = { createdDate: new Date('2026-01-01'), workshopDate: new Date('2026-03-01') };
		const later = { createdDate: new Date('2026-01-02'), workshopDate: new Date('2026-04-01') };
		const firstHearing = { createdDate: earlier.createdDate, hearingDate: new Date('2026-05-01') };
		const secondHearing = { createdDate: later.createdDate, hearingDate: new Date('2026-06-01') };
		const completionDate = new Date('2026-02-01');
		const { context } = createContext({
			gateway2Info: { workshops: [later, earlier] },
			gateway3Info: {
				submissions: [
					{ decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED, completionDate: new Date('2026-01-01') },
					{ decision: GATEWAY_3_DECISION_ID.PROCEED_TO_EXAMINATION, completionDate }
				]
			},
			examinationInfo: { hearings: [secondHearing, firstHearing] }
		});

		await new TimetableTabHandler().handle(context);

		const answers = context.res.locals.journeyResponse.answers;
		assert.equal(answers.gateway3CompletionDate, completionDate);
		assert.deepEqual(answers.workshops, [earlier, later]);
		assert.deepEqual(answers.hearings, [firstHearing, secondHearing]);
	});

	it('does not show a completion date for an unissued or resubmission-required decision', async () => {
		const { context } = createContext({
			gateway3Info: {
				submissions: [
					{ decision: null, completionDate: null },
					{ decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED, completionDate: new Date('2026-01-01') }
				]
			}
		});

		await new TimetableTabHandler().handle(context);

		assert.equal(context.res.locals.journeyResponse.answers.gateway3CompletionDate, undefined);
	});

	it('does not carry dates or grouped records into a subsequent case with no saved stages', async () => {
		const handler = new TimetableTabHandler();
		const first = createContext({
			gateway2Info: { expectedDate: new Date('2026-01-01'), workshops: [{ createdDate: new Date('2026-01-01') }] },
			examinationInfo: { letterIssueDate: new Date('2026-02-01'), hearings: [{ createdDate: new Date('2026-01-01') }] }
		});
		await handler.handle(first.context);
		const firstAnswers = { ...first.context.res.locals.journeyResponse.answers };
		const second = createContext({}, 'case-2');

		await handler.handle(second.context);

		assert.deepEqual(second.context.res.locals.journeyResponse.answers, {
			expectedDate: undefined,
			actualDate: undefined,
			gateway3ExpectedDate: undefined,
			gateway3ActualDate: undefined,
			gateway3CompletionDate: undefined,
			workshops: [],
			hearings: [],
			isSound: undefined
		});
		assert.deepEqual(first.context.res.locals.journeyResponse.answers, firstAnswers);
		for (const model of Object.values(second.db)) {
			assert.deepEqual(model.findUnique.mock.calls[0].arguments[0].where, { caseId: 'case-2' });
		}
	});
});
