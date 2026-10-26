import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PageLoadContext } from './overview-page-load-handler.ts';
import { OverviewTabHandler } from './overview-tab-handler.ts';
import { Gateway1TabHandler } from './gateway-1-tab-handler.ts';
import { Gateway2TabHandler } from './gateway-2-tab-handler.ts';
import { Gateway3TabHandler } from './gateway-3-tab-handler.ts';
import { Gateway3SubmissionHandler } from './gateway-3-submission-handler.ts';
import { ExaminationTabHandler } from './examination-tab-handler.ts';

describe('Case pause banners', () => {
	for (const [journeyId, Handler] of [
		['overview', OverviewTabHandler],
		['gateway-1', Gateway1TabHandler],
		['gateway-2', Gateway2TabHandler],
		['gateway-3', Gateway3TabHandler],
		['gateway-3-submission', Gateway3SubmissionHandler],
		['examination', ExaminationTabHandler]
	] as const) {
		it(`shows the ${journeyId} banner on first load without leaking it to another case`, async () => {
			const session = {};
			const makeContext = (reference: string) =>
				({
					req: { method: 'GET', params: { reference }, query: {}, url: `/${journeyId}`, session },
					res: { locals: {}, redirect: () => {} },
					next: () => {},
					journeyId,
					reference,
					caseRecord: { id: reference, planTitle: reference },
					service: {
						authDisabled: true,
						db: {
							case: { findUnique: async () => ({ lpas: [], contacts: [] }) },
							gateway1Info: { findUnique: async () => ({}) },
							gateway2Info: { findUnique: async () => ({ workshops: [] }) },
							gateway3Info: { findUnique: async () => ({ submissions: [] }) },
							examinationInfo: {
								findUnique: async () => ({
									hearings: [],
									planPauseHistory: reference === 'PLAN-123456' ? [{ planPauseDate: new Date(0) }] : []
								})
							},
							documentSet: {
								findMany: async ({ where }: { where: { folderName: { in: string[] } } }) =>
									where.folderName.in.map((folderName) => ({ id: folderName, folderName }))
							},
							document: { findMany: async () => [] }
						}
					}
				}) as unknown as PageLoadContext;
			const handler = new Handler();
			const paused = makeContext('PLAN-123456');
			await handler.handle(paused);
			assert.equal(paused.res.locals.alerts?.length, 1);
			assert.equal(paused.res.locals.alerts[0].text, 'This examination is paused');
			assert.match(paused.res.locals.alerts[0].html, /href="\/case\/PLAN-123456\/examination"/);
			assert.equal(paused.req.session.alerts, undefined);

			const editing = makeContext('PLAN-123456');
			editing.req.params.question = 'existing-question';
			await handler.handle(editing);
			assert.equal(editing.res.locals.alerts, undefined);
			assert.equal(editing.req.session.alerts, undefined);

			const unpaused = makeContext('PLAN-654321');
			await handler.handle(unpaused);
			assert.equal(unpaused.res.locals.alerts, undefined);
			assert.equal(unpaused.req.session.alerts, undefined);
		});
	}
});
