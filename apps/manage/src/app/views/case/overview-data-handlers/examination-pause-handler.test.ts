import { ExaminationPauseHandler } from './examination-pause-handler.ts';
import { ExaminationTabHandler } from './examination-tab-handler.ts';
import { type PageLoadContext } from './overview-page-load-handler.ts';
import type { Request } from 'express';
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

describe('Test ExaminationPauseHandler', () => {
	describe('test handle', () => {
		const handler = new ExaminationPauseHandler();
		it('redirects if question is undefined', async () => {
			const context = {
				req: {
					params: {},
					session: {}
				} as Request,
				res: new Response()
			} as any as PageLoadContext;
			context.res.redirect = mock.fn(async () => {});
			await handler.handle(context);
			assert.equal((context.res.redirect as any).mock?.calls?.length, 1);
		});
		it('keeps Cancel pointing to Examination on every pause and restart question', async (t) => {
			t.mock.method(ExaminationTabHandler.prototype, 'handle', async () => {});
			for (const question of [
				'examination-pause-start-date-1',
				'examination-pause-details-1',
				'examination-pause-end-date-2',
				'examination-pause-restart-details-2'
			]) {
				const context = {
					req: { params: { reference: 'PLAN-123456', question } },
					res: { locals: {} }
				} as unknown as PageLoadContext;
				await handler.handle(context);
				assert.equal(context.res.locals.cancelLink, '/case/PLAN-123456/examination');
			}
		});
	});
});
