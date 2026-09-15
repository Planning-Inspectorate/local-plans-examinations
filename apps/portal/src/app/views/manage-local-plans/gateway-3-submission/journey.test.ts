import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import type { Request } from 'express';
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { createJourney, JOURNEY_ID } from './journey.ts';
import { createGateway3Questions } from './questions.ts';

describe('createJourney (Gateway 3)', () => {
	it('builds scoped Gateway 3 submission URLs from a plan reference', () => {
		const response = new JourneyResponse(JOURNEY_ID, 'case-id', {});
		const req = {
			baseUrl: '/manage-local-plans',
			params: {
				planReference: 'PLAN-123456'
			}
		} as unknown as Request;

		const journey = createJourney(req, response, createGateway3Questions('PLAN/123456'));

		assert.strictEqual(journey.baseUrl, '/manage-local-plans/PLAN-123456/gateway-3-submission');
		assert.strictEqual(journey.taskListUrl, '/manage-local-plans/PLAN-123456/gateway-3-submission');
		assert.strictEqual(
			journey.taskListTemplate,
			'views/manage-local-plans/gateway-3-submission/check-your-answers.njk'
		);
		assert.strictEqual(
			journey.getCurrentQuestionUrl('required-information', 'examination-website'),
			'/manage-local-plans/PLAN-123456/gateway-3-submission/required-information/examination-website'
		);
		assert.strictEqual(
			journey.getCurrentQuestionUrl('required-information', 'proposed-local-plan'),
			'/manage-local-plans/PLAN-123456/gateway-3-submission/required-information/proposed-local-plan'
		);
	});

	it('builds session Gateway 3 submission URLs without a plan reference', () => {
		const response = new JourneyResponse(JOURNEY_ID, 'session', {});
		const req = {
			baseUrl: '/manage-local-plans',
			params: {}
		} as unknown as Request;

		const journey = createJourney(req, response, createGateway3Questions('PLAN/123456'));

		assert.strictEqual(journey.baseUrl, '/manage-local-plans/gateway-3-submission');
		assert.strictEqual(journey.taskListUrl, '/manage-local-plans/gateway-3-submission');
		assert.strictEqual(journey.initialBackLink, '/');
	});

	it('treats Gateway 3 documents as optional in the journey', () => {
		assert.strictEqual(createTestJourney({}).isComplete(), true);
		assert.strictEqual(createTestJourney({ examinationWebsite: '' }).isComplete(), true);
		assert.strictEqual(createTestJourney({ proposedLocalPlan: [] }).isComplete(), true);
		assert.strictEqual(createTestJourney({ mapOfPolicies: [] }).isComplete(), true);
		assert.strictEqual(createTestJourney({ statementOfCompliance: [] }).isComplete(), true);
		assert.strictEqual(createTestJourney({ statementOfSoundness: [] }).isComplete(), true);
		assert.strictEqual(createTestJourney({ consultationEngagementSummary: [] }).isComplete(), true);
		assert.strictEqual(createTestJourney({ scopingConsultationSummary: [] }).isComplete(), true);
		assert.strictEqual(createTestJourney({ consultationContentEvidenceSummary: [] }).isComplete(), true);
		assert.strictEqual(createTestJourney({ consultationProposedPlanSummary: [] }).isComplete(), true);
		assert.strictEqual(createTestJourney({ practicalArrangementsStatement: [] }).isComplete(), true);
	});
});

function createTestJourney(answers: Record<string, unknown>) {
	const response = new JourneyResponse(JOURNEY_ID, 'session', answers);
	const req = {
		baseUrl: '/manage-local-plans',
		params: {}
	} as unknown as Request;

	return createJourney(req, response, createGateway3Questions('PLAN/123456'));
}
