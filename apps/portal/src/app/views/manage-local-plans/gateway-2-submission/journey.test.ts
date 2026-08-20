import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import type { Request } from 'express';
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { createJourney, JOURNEY_ID } from './journey.ts';
import { gateway2FileUploadQuestions, questions } from './questions.ts';

describe('createJourney', () => {
	it('builds scoped Gateway 2 submission URLs from a plan reference', () => {
		const response = new JourneyResponse(JOURNEY_ID, 'case-id', {});
		const req = {
			baseUrl: '/manage-local-plans',
			params: {
				planReference: 'PLAN/123456'
			}
		} as unknown as Request;

		const journey = createJourney(req, response, questions);

		assert.strictEqual(journey.baseUrl, '/manage-local-plans/PLAN%2F123456/gateway-2-submission');
		assert.strictEqual(journey.taskListUrl, '/manage-local-plans/PLAN%2F123456/gateway-2-submission');
		assert.strictEqual(
			journey.taskListTemplate,
			'views/manage-local-plans/gateway-2-submission/check-your-answers.njk'
		);
		assert.strictEqual(
			journey.getCurrentQuestionUrl('procedural', 'covering-letter'),
			'/manage-local-plans/PLAN%2F123456/gateway-2-submission/procedural/covering-letter'
		);
	});

	it('builds session Gateway 2 submission URLs without a plan reference', () => {
		const response = new JourneyResponse(JOURNEY_ID, 'session', {});
		const req = {
			baseUrl: '/manage-local-plans',
			params: {}
		} as unknown as Request;

		const journey = createJourney(req, response, questions);

		assert.strictEqual(journey.baseUrl, '/manage-local-plans/gateway-2-submission');
		assert.strictEqual(journey.taskListUrl, '/manage-local-plans/gateway-2-submission');
		assert.strictEqual(journey.initialBackLink, '/');
	});

	it('is incomplete until a local plan timetable has been uploaded', () => {
		assert.strictEqual(createTestJourney({}).isComplete(), false);
		assert.strictEqual(createTestJourney({ localPlanTimetable: [] }).isComplete(), false);
		assert.strictEqual(createTestJourney(buildUploadedDocumentAnswers()).isComplete(), true);
	});
});

function buildUploadedDocumentAnswers() {
	const uploadedFile = {
		id: 'file-1',
		fileName: 'document.pdf',
		mimeType: 'application/pdf',
		size: 100,
		storageProvider: 'blob'
	};

	return Object.fromEntries(
		Object.values(gateway2FileUploadQuestions).map((questionConfig) => [questionConfig.fieldName, [uploadedFile]])
	);
}

function createTestJourney(answers: Record<string, unknown>) {
	const response = new JourneyResponse(JOURNEY_ID, 'session', answers);
	const req = {
		baseUrl: '/manage-local-plans',
		params: {}
	} as unknown as Request;

	return createJourney(req, response, questions);
}
