import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { createJourney, JOURNEY_ID } from './journey.ts';
import { questions } from './questions.ts';

describe('createJourney', () => {
	it('builds scoped Gateway 2 submission URLs from a plan reference', () => {
		const response = new JourneyResponse(JOURNEY_ID, 'case-id', {});
		const req = {
			baseUrl: '/manage-local-plan',
			params: {
				planReference: 'PLAN-123456'
			}
		} as any;

		const journey = createJourney(req, response, questions);

		assert.strictEqual(journey.baseUrl, '/manage-local-plan/PLAN-123456/gateway-2-submission');
		assert.strictEqual(journey.taskListUrl, '/manage-local-plan/PLAN-123456/gateway-2-submission');
		assert.strictEqual(
			journey.getCurrentQuestionUrl('procedural', 'gateway-2-cover-letter'),
			'/manage-local-plan/PLAN-123456/gateway-2-submission/procedural/gateway-2-cover-letter'
		);
	});

	it('builds session Gateway 2 submission URLs without a plan reference', () => {
		const response = new JourneyResponse(JOURNEY_ID, 'session', {});
		const req = {
			baseUrl: '/manage-local-plan',
			params: {}
		} as any;

		const journey = createJourney(req, response, questions);

		assert.strictEqual(journey.baseUrl, '/manage-local-plan/gateway-2-submission');
		assert.strictEqual(journey.taskListUrl, '/manage-local-plan/gateway-2-submission');
		assert.strictEqual(journey.initialBackLink, '/');
	});

	it('is incomplete until a Gateway 2 cover letter has been uploaded', () => {
		assert.strictEqual(createTestJourney({}).isComplete(), false);
		assert.strictEqual(createTestJourney({ gateway2CoverLetter: [] }).isComplete(), false);
		assert.strictEqual(
			createTestJourney({
				gateway2CoverLetter: [
					{
						id: 'file-1',
						fileName: 'cover-letter.pdf',
						mimeType: 'application/pdf',
						size: 100,
						storageProvider: 'blob'
					}
				]
			}).isComplete(),
			true
		);
	});
});

function createTestJourney(answers: Record<string, unknown>) {
	const response = new JourneyResponse(JOURNEY_ID, 'session', answers);
	const req = {
		baseUrl: '/manage-local-plan',
		params: {}
	} as any;

	return createJourney(req, response, questions);
}
