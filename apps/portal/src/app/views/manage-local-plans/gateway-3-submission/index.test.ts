import assert from 'node:assert';
import type { Request, Response } from 'express';
import { describe, it } from 'node:test';
import { setGateway3ViewLocals } from './index.ts';

describe('setGateway3ViewLocals', () => {
	it('sets page title, heading, caption, back link, save link and status tag when case and plan reference exist', () => {
		const req = {
			currentCase: {
				planTitle: 'Test Local Plan',
				gateway3Date: new Date('2026-06-12T00:00:00.000Z')
			},
			params: { planReference: 'PLAN-003' }
		} as any;

		const locals: Record<string, unknown> = {};
		const res = { locals } as unknown as Response;

		setGateway3ViewLocals(req as unknown as Request, res);

		assert.strictEqual(locals.pageTitle, 'Gateway 3 submission');
		assert.strictEqual(locals.pageHeading, 'Gateway 3 submission');
		assert.strictEqual(locals.pageCaption, 'Test Local Plan');
		assert.strictEqual(locals.backLinkUrl, '/manage-local-plans/PLAN-003');
		assert.strictEqual(locals.saveAndComeBackUrl, '/manage-local-plans/PLAN-003');
		assert.strictEqual(locals.targetDate, '12 June 2026');
		assert.deepStrictEqual(locals.statusTag, { label: 'Ready to start', class: 'govuk-tag govuk-tag--green' });
	});

	it('does not set back link or save link when no plan reference', () => {
		const req = {
			currentCase: {
				planTitle: 'Test Local Plan'
			},
			params: {}
		} as any;

		const locals: Record<string, unknown> = {};
		const res = { locals } as unknown as Response;

		setGateway3ViewLocals(req as unknown as Request, res);

		assert.strictEqual(locals.pageTitle, 'Gateway 3 submission');
		assert.strictEqual(locals.backLinkUrl, undefined);
		assert.strictEqual(locals.saveAndComeBackUrl, undefined);
	});

	it('does not set targetDate when case has no gateway3Date', () => {
		const req = {
			currentCase: {
				planTitle: 'Test Local Plan',
				gateway3Date: null
			},
			params: { planReference: 'PLAN-003' }
		} as any;

		const locals: Record<string, unknown> = {};
		const res = { locals } as unknown as Response;

		setGateway3ViewLocals(req as unknown as Request, res);

		assert.strictEqual(locals.targetDate, undefined);
	});
});
