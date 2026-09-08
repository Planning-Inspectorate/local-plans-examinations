import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import type { Request } from 'express';
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { createJourney, JOURNEY_ID } from './journey.ts';

describe('createJourney (Gateway 3)', () => {
	it('builds scoped Gateway 3 submission URLs from a plan reference', () => {
		const response = new JourneyResponse(JOURNEY_ID, 'case-id', {});
		const req = {
			baseUrl: '/manage-local-plans',
			params: {
				planReference: 'PLAN-123456'
			}
		} as unknown as Request;

		const journey = createJourney(req, response);

		assert.strictEqual(journey.baseUrl, '/manage-local-plans/PLAN-123456/gateway-3-submission');
		assert.strictEqual(journey.taskListUrl, '/manage-local-plans/PLAN-123456/gateway-3-submission');
		assert.strictEqual(
			journey.taskListTemplate,
			'views/manage-local-plans/gateway-3-submission/check-your-answers.njk'
		);
	});

	it('builds session Gateway 3 submission URLs without a plan reference', () => {
		const response = new JourneyResponse(JOURNEY_ID, 'session', {});
		const req = {
			baseUrl: '/manage-local-plans',
			params: {}
		} as unknown as Request;

		const journey = createJourney(req, response);

		assert.strictEqual(journey.baseUrl, '/manage-local-plans/gateway-3-submission');
		assert.strictEqual(journey.taskListUrl, '/manage-local-plans/gateway-3-submission');
		assert.strictEqual(journey.initialBackLink, '/');
	});
});
