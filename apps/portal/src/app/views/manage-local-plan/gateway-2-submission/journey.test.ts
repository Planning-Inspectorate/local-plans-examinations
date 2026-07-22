import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import type { Request } from 'express';
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
		} as unknown as Request;

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
		} as unknown as Request;

		const journey = createJourney(req, response, questions);

		assert.strictEqual(journey.baseUrl, '/manage-local-plan/gateway-2-submission');
		assert.strictEqual(journey.taskListUrl, '/manage-local-plan/gateway-2-submission');
		assert.strictEqual(journey.initialBackLink, '/');
	});

	it('builds the local plan timetable question URL from a plan reference', () => {
		const response = new JourneyResponse(JOURNEY_ID, 'case-id', {});
		const req = {
			baseUrl: '/manage-local-plan',
			params: {
				planReference: 'PLAN-123456'
			}
		} as unknown as Request;

		const journey = createJourney(req, response, questions);

		assert.strictEqual(
			journey.getCurrentQuestionUrl('procedural', 'local-plan-timetable'),
			'/manage-local-plan/PLAN-123456/gateway-2-submission/procedural/local-plan-timetable'
		);
	});

	it('is incomplete until both a cover letter and a timetable have been uploaded', () => {
		const coverLetterFile = {
			id: 'file-1',
			fileName: 'cover-letter.pdf',
			mimeType: 'application/pdf',
			size: 100,
			storageProvider: 'blob'
		};
		const timetableFile = {
			id: 'file-2',
			fileName: 'timetable.pdf',
			mimeType: 'application/pdf',
			size: 200,
			storageProvider: 'blob'
		};

		assert.strictEqual(createTestJourney({}).isComplete(), false);
		assert.strictEqual(createTestJourney({ gateway2CoverLetter: [] }).isComplete(), false);
		assert.strictEqual(createTestJourney({ gateway2CoverLetter: [coverLetterFile] }).isComplete(), false);
		assert.strictEqual(createTestJourney({ gateway2LocalPlanTimetable: [timetableFile] }).isComplete(), false);
		assert.strictEqual(
			createTestJourney({
				gateway2CoverLetter: [coverLetterFile],
				gateway2LocalPlanTimetable: [timetableFile]
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
	} as unknown as Request;

	return createJourney(req, response, questions);
}
