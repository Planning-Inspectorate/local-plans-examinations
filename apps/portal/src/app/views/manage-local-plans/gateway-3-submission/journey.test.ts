import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import type { Request } from 'express';
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { createJourney, JOURNEY_ID } from './journey.ts';
import { createGateway3Questions } from './questions.ts';

function buildQuestions() {
	return createGateway3Questions(undefined);
}

describe('createJourney (Gateway 3)', () => {
	it('builds scoped Gateway 3 submission URLs from a plan reference', () => {
		const response = new JourneyResponse(JOURNEY_ID, 'case-id', {});
		const req = {
			baseUrl: '/manage-local-plans',
			params: {
				planReference: 'PLAN-123456'
			}
		} as unknown as Request;

		const journey = createJourney(req, response, buildQuestions());

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

		const journey = createJourney(req, response, buildQuestions());

		assert.strictEqual(journey.baseUrl, '/manage-local-plans/gateway-3-submission');
		assert.strictEqual(journey.taskListUrl, '/manage-local-plans/gateway-3-submission');
		assert.strictEqual(journey.initialBackLink, '/');
	});

	it('creates a Required Information section with all 10 questions', () => {
		const response = new JourneyResponse(JOURNEY_ID, 'case-id', {});
		const req = {
			baseUrl: '/manage-local-plans',
			params: { planReference: 'PLAN-001' }
		} as unknown as Request;

		const journey = createJourney(req, response, buildQuestions());

		assert.strictEqual(journey.sections.length, 1);
		assert.strictEqual(journey.sections[0].name, 'Required Information');
		assert.strictEqual(journey.sections[0].questions.length, 10);
	});

	it('overrides back link to the overview URL for non-manage-list pages', () => {
		const response = new JourneyResponse(JOURNEY_ID, 'case-id', {});
		const req = {
			baseUrl: '/manage-local-plans',
			params: { planReference: 'PLAN-001' }
		} as unknown as Request;

		const journey = createJourney(req, response, buildQuestions());
		const backLink = journey.getBackLink({ params: {} as any });

		assert.strictEqual(backLink, '/manage-local-plans/PLAN-001/gateway-3-submission');
	});
});
