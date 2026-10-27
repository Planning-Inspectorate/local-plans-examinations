import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import {
	buildSubmissionFailureHandler,
	renderSubmissionFailurePage,
	SUBMISSION_FAILURE_PAGE_TITLE,
	SUBMISSION_FAILURE_VIEW_PATH
} from './submission-failure.ts';
import { submissionFailurePage } from './controller.ts';
import type { PortalService } from '#service';

function createRes() {
	const renderCalls: Array<[string, Record<string, unknown>]> = [];
	const statusCalls: number[] = [];

	const res = {
		locals: {},
		status(code: number) {
			statusCalls.push(code);
			return this;
		},
		render(view: string, model?: Record<string, unknown>) {
			renderCalls.push([view, model ?? {}]);
			return this;
		}
	} as unknown as Response;

	return { res, renderCalls, statusCalls };
}

describe('renderSubmissionFailurePage', () => {
	it('renders the failed submission page with a 500 status', () => {
		const { res, renderCalls, statusCalls } = createRes();

		renderSubmissionFailurePage(res, { planReference: 'PLAN-123456' });

		assert.deepEqual(statusCalls, [500]);
		assert.equal(renderCalls.length, 1);
		assert.equal(renderCalls[0][0], SUBMISSION_FAILURE_VIEW_PATH);
		assert.equal(renderCalls[0][1].pageTitle, SUBMISSION_FAILURE_PAGE_TITLE);
		assert.equal(renderCalls[0][1].pageHeading, 'Sorry, there is a problem with the service');
		assert.equal(renderCalls[0][1].planOverviewUrl, '/manage-local-plans/PLAN-123456');
	});

	it('encodes the plan reference in the return to your plan link', () => {
		const { res, renderCalls } = createRes();

		renderSubmissionFailurePage(res, { planReference: 'PLAN 123/456' });

		assert.equal(renderCalls[0][1].planOverviewUrl, '/manage-local-plans/PLAN%20123%2F456');
	});

	it('falls back to the your plans page when there is no plan reference', () => {
		const { res, renderCalls } = createRes();

		renderSubmissionFailurePage(res);

		assert.equal(renderCalls[0][1].planOverviewUrl, '/manage-local-plans/your-plans');
	});
});

describe('submissionFailurePage', () => {
	it('renders the failed submission page for the requested plan', async () => {
		const warnCalls: unknown[] = [];
		const service = {
			logger: {
				warn: (...args: unknown[]) => warnCalls.push(args)
			}
		} as unknown as PortalService;

		const { res, renderCalls, statusCalls } = createRes();
		const req = { query: { planReference: 'PLAN-123456' } } as unknown as Request;

		await submissionFailurePage(service)(req, res, () => {});

		assert.deepEqual(statusCalls, [500]);
		assert.equal(renderCalls[0][0], SUBMISSION_FAILURE_VIEW_PATH);
		assert.equal(renderCalls[0][1].planOverviewUrl, '/manage-local-plans/PLAN-123456');
		assert.equal(warnCalls.length, 1);
	});
});

describe('buildSubmissionFailureHandler', () => {
	for (const scenario of [
		{ name: 'GET requests', request: { method: 'GET' } },
		{ name: 'nested paths', request: { path: '/another-page' } },
		{ name: 'responses already sent', response: { headersSent: true } },
		{ name: 'committed submissions', response: { locals: { submissionCompleted: true } } },
		{ name: 'HTTP client errors', error: Object.assign(new Error('Forbidden'), { status: 403 }) },
		{ name: 'statusCode client errors', error: Object.assign(new Error('Not found'), { statusCode: 404 }) }
	]) {
		it(`passes through ${scenario.name}`, () => {
			const { res, renderCalls, statusCalls } = createRes();
			Object.assign(res, scenario.response);
			const req = { method: 'POST', path: '/', params: { planReference: 'PLAN-001' }, ...scenario.request };
			const error = scenario.error ?? new Error('database unavailable');
			const nextCalls: unknown[] = [];

			buildSubmissionFailureHandler({} as PortalService)(error, req as unknown as Request, res, (err) =>
				nextCalls.push(err)
			);

			assert.deepEqual(nextCalls, [error]);
			assert.deepEqual(renderCalls, []);
			assert.deepEqual(statusCalls, []);
		});
	}
});
