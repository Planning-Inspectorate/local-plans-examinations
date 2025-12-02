import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createJourney, JOURNEY_ID } from './journey.ts';
import { MOCK_QUESTIONS, TEST_DATA, createMockRequest } from '../test-utils.ts';

describe('Journey', () => {
	describe('JOURNEY_ID', () => {
		it('should export correct journey identifier', () => {
			assert.strictEqual(JOURNEY_ID, 'questionnaire');
		});
	});

	describe('createJourney', () => {
		it('should create journey with correct configuration', () => {
			const mockReq = createMockRequest();

			const journey = createJourney(MOCK_QUESTIONS, TEST_DATA.mockResponse, mockReq);

			assert.ok(journey);
			assert.strictEqual(journey.journeyId, 'questionnaire');
			assert.strictEqual(journey.taskListUrl, '/questionnaire/check-your-answers');
			assert.strictEqual(journey.journeyTemplate, 'views/layouts/forms-question.njk');
			assert.strictEqual(journey.taskListTemplate, 'views/layouts/forms-check-your-answers.njk');
			assert.strictEqual(journey.journeyTitle, 'Local Plans Questionnaire');
			assert.strictEqual(journey.returnToListing, false);
			assert.strictEqual(journey.initialBackLink, '/questionnaire');
		});

		it('should validate request URL correctly', () => {
			const mockReq = createMockRequest();

			assert.doesNotThrow(() => {
				createJourney(MOCK_QUESTIONS, TEST_DATA.mockResponse, mockReq);
			});
		});

		it('should throw error for invalid request URL', () => {
			const mockReq = createMockRequest();
			mockReq.baseUrl = '/invalid-path';

			assert.throws(() => {
				createJourney(MOCK_QUESTIONS, TEST_DATA.mockResponse, mockReq);
			}, /Invalid journey request for 'questionnaire' journey/);
		});

		it('should handle different questionnaire base URLs', () => {
			const validUrls = ['/questionnaire', '/some/path/questionnaire', '/app/questionnaire'];

			validUrls.forEach((url) => {
				const mockReq = createMockRequest();
				mockReq.baseUrl = url;
				assert.doesNotThrow(() => {
					createJourney(MOCK_QUESTIONS, TEST_DATA.mockResponse, mockReq);
				}, `Should accept URL: ${url}`);
			});
		});

		it('should reject URLs not ending with questionnaire', () => {
			const invalidUrls = ['/questionnaire/extra', '/questionnaires', '/question', '/other-path'];

			invalidUrls.forEach((url) => {
				const mockReq = createMockRequest();
				mockReq.baseUrl = url;
				assert.throws(
					() => {
						createJourney(MOCK_QUESTIONS, TEST_DATA.mockResponse, mockReq);
					},
					/Invalid journey request/,
					`Should reject URL: ${url}`
				);
			});
		});

		it('should create baseUrl function correctly', () => {
			const mockReq = createMockRequest();
			mockReq.baseUrl = '/test/questionnaire';

			const journey = createJourney(MOCK_QUESTIONS, TEST_DATA.mockResponse, mockReq);
			const baseUrlFn = journey.makeBaseUrl;

			assert.strictEqual(typeof baseUrlFn, 'function');
			assert.strictEqual(baseUrlFn(), '/test/questionnaire');
		});

		it('should pass response data to journey', () => {
			const mockReq = createMockRequest();

			const customResponse = {
				answers: { fullName: 'Jane Doe' },
				customData: 'test'
			};

			const journey = createJourney(MOCK_QUESTIONS, customResponse, mockReq);
			assert.strictEqual(journey.response, customResponse);
		});

		it('should handle empty questions object', () => {
			const mockReq = createMockRequest();

			// Empty questions should throw because sections need valid questions
			assert.throws(() => {
				createJourney({}, TEST_DATA.mockResponse, mockReq);
			});
		});

		it('should handle null/undefined response', () => {
			const mockReq = createMockRequest();

			assert.doesNotThrow(() => {
				createJourney(MOCK_QUESTIONS, null, mockReq);
			});

			assert.doesNotThrow(() => {
				createJourney(MOCK_QUESTIONS, undefined, mockReq);
			});
		});

		it('should require all expected questions to be defined', () => {
			const mockReq = createMockRequest();

			const expectedQuestions = ['fullName', 'wantToProvideEmail', 'email', 'rating', 'feedback'] as const;
			expectedQuestions.forEach((questionKey) => {
				assert.ok(
					MOCK_QUESTIONS[questionKey as keyof typeof MOCK_QUESTIONS],
					`Question ${questionKey} should be defined for journey creation`
				);
			});

			assert.doesNotThrow(() => {
				createJourney(MOCK_QUESTIONS, TEST_DATA.mockResponse, mockReq);
			});
		});
	});
});
