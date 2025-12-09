import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { createEditJourney, EDIT_JOURNEY_ID } from './journey.ts';
import type { JourneyResponse } from '@planning-inspectorate/dynamic-forms/src/journey/journey-response.js';
import type { Request } from 'express';

describe('Edit Journey', () => {
	const mockRequest = {
		originalUrl: '/questionnaire/123/edit/personal-information/name',
		params: { id: '123' }
	} as Request;

	const mockJourneyResponse: JourneyResponse = {
		answers: {
			name: 'John Doe',
			email: 'john@example.com'
		}
	};

	it('should create journey with correct configuration', () => {
		const journey = createEditJourney('123', mockJourneyResponse, mockRequest);

		assert.strictEqual(journey.journeyId, EDIT_JOURNEY_ID);
		assert.strictEqual(journey.journeyTitle, 'Edit Questionnaire Submission');
		assert.strictEqual(journey.baseUrl, '/questionnaire/123/edit');
		assert.ok(journey.sections.length > 0);
	});

	it('should throw error for invalid request URL', () => {
		const invalidRequest = {
			originalUrl: '/invalid/path',
			params: { id: '123' }
		} as Request;

		assert.throws(() => createEditJourney('123', mockJourneyResponse, invalidRequest), /Invalid journey request/);
	});

	it('should override getBackLink to return detail page', () => {
		const journey = createEditJourney('123', mockJourneyResponse, mockRequest);

		const backLink = journey.getBackLink();
		assert.strictEqual(backLink, '/questionnaire/123');
	});

	it('should add warning text to questions', () => {
		const journey = createEditJourney('123', mockJourneyResponse, mockRequest);

		const section = journey.sections[0];
		const question = section.questions[0];
		const viewModel = question.prepQuestionForRendering(section, journey, {}, {});

		assert.strictEqual(
			viewModel.warningText,
			'Changes made will update the submission immediately and cannot be undone.'
		);
	});

	it('should override handleNextQuestion to redirect to detail page', () => {
		const journey = createEditJourney('123', mockJourneyResponse, mockRequest);

		const mockRes = {
			redirect: mock.fn()
		};

		const section = journey.sections[0];
		const question = section.questions[0];
		question.handleNextQuestion(mockRes as any);

		assert.strictEqual(mockRes.redirect.mock.callCount(), 1);
		assert.strictEqual(mockRes.redirect.mock.calls[0].arguments[0], '/questionnaire/123');
	});

	it('should use correct journey ID', () => {
		assert.strictEqual(EDIT_JOURNEY_ID, 'questionnaire');
	});

	it('should create sections with questions', () => {
		const journey = createEditJourney('123', mockJourneyResponse, mockRequest);

		assert.ok(journey.sections.length > 0);
		assert.ok(journey.sections[0].questions.length > 0);
	});
});
