import { ExaminationPauseHandler } from './examination-pause-handler.ts';
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
	});
});
