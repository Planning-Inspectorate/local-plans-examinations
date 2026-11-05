import { Gateway3SubmissionHandler } from './gateway-3-submission-handler.ts';
import { type PageLoadContext } from './overview-page-load-handler.ts';
import type { Request } from 'express';
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

describe('Test Gateway3SubmissionHandler', () => {
	describe('test handle', () => {
		const handler = new Gateway3SubmissionHandler();
		it('redirects if question is undefined', async () => {
			const context = {
				req: {
					params: {},
					session: {}
				} as Request,
				res: new Response(),
				service: {
					db: {}
				}
			} as any as PageLoadContext;
			context.res.redirect = mock.fn(async () => {});
			await handler.handle(context);
			assert.equal((context.res.redirect as any).mock?.calls?.length, 1);
		});
	});
});
