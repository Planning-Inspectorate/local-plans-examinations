import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import type { Request } from 'express';
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { createJourney, JOURNEY_ID } from './journey.ts';
import { createGateway2Questions } from './questions.ts';

describe('createJourney', () => {
	it('builds Gateway 2 submission URLs from the router base URL when a plan reference is present', () => {
		const response = new JourneyResponse(JOURNEY_ID, 'case-id', {});
		const req = {
			baseUrl: '/manage-local-plans',
			params: {
				planReference: 'PLAN-123456'
			}
		} as unknown as Request;

		const journey = createJourney(req, response, createGateway2Questions('PLAN/123456'));

		assert.strictEqual(journey.baseUrl, '/manage-local-plans');
		assert.strictEqual(journey.taskListUrl, '/manage-local-plans');
		assert.strictEqual(
			journey.taskListTemplate,
			'views/manage-local-plans/gateway-2-submission/check-your-answers.njk'
		);
		assert.strictEqual(
			journey.getCurrentQuestionUrl('procedural', 'covering-letter'),
			'/manage-local-plans/procedural/covering-letter'
		);
		assert.strictEqual(
			journey.getCurrentQuestionUrl('consultation', 'g1-self-assess'),
			'/manage-local-plans/consultation/g1-self-assess'
		);
		assert.strictEqual(
			journey.getCurrentQuestionUrl('consultation', 'cons-of-proposed'),
			'/manage-local-plans/consultation/cons-of-proposed'
		);
	});

	it('builds Gateway 2 submission URLs from the router base URL without a plan reference', () => {
		const response = new JourneyResponse(JOURNEY_ID, 'session', {});
		const req = {
			baseUrl: '/manage-local-plans',
			params: {}
		} as unknown as Request;

		const journey = createJourney(req, response, createGateway2Questions('PLAN/123456'));

		assert.strictEqual(journey.baseUrl, '/manage-local-plans');
		assert.strictEqual(journey.taskListUrl, '/manage-local-plans');
		assert.strictEqual(journey.initialBackLink, '/');
	});

	it('treats Gateway 2 documents as optional in the journey', () => {
		assert.strictEqual(createTestJourney({}).isComplete(), true);
		assert.strictEqual(createTestJourney({ gateway2CoverLetter: [] }).isComplete(), true);
		assert.strictEqual(createTestJourney({ draftStatementOfCompliance: [] }).isComplete(), true);
		assert.strictEqual(createTestJourney({ projectInitiationDocument: [] }).isComplete(), true);
		assert.strictEqual(createTestJourney({ localPlanTimetable: [] }).isComplete(), true);
		assert.strictEqual(createTestJourney({ noticeOfIntention: [] }).isComplete(), true);
		assert.strictEqual(createTestJourney({ gateway1SelfAssessment: [] }).isComplete(), true);
		assert.strictEqual(createTestJourney({ consultationOnProposedContent: [] }).isComplete(), true);
		assert.strictEqual(createTestJourney({ draftStatementOfSoundness: [] }).isComplete(), true);
		assert.strictEqual(createTestJourney({ scopingConsultationDocuments: [] }).isComplete(), true);
		assert.strictEqual(createTestJourney({ consultationSummaryFeedbackScoping: [] }).isComplete(), true);
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
		Object.values(createGateway2Questions('PLAN/123456')).map((questionConfig) => [
			questionConfig.fieldName,
			[uploadedFile]
		])
	);
}

function createTestJourney(answers: Record<string, unknown>) {
	const response = new JourneyResponse(JOURNEY_ID, 'session', answers);
	const req = {
		baseUrl: '/manage-local-plans',
		params: {}
	} as unknown as Request;

	return createJourney(req, response, createGateway2Questions('PLAN/123456'));
}
