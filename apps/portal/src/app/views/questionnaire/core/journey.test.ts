import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { createJourney, JOURNEY_ID } from './journey.ts';

describe('Journey', () => {
	const mockQuestions = {
		fullName: {
			type: 'single-line-input',
			title: 'Full Name',
			question: 'What is your full name?',
			fieldName: 'fullName',
			url: 'full-name',
			validators: []
		},
		wantToProvideEmail: {
			type: 'boolean',
			title: 'Email',
			question: 'Do you want to provide your email?',
			fieldName: 'wantToProvideEmail',
			url: 'want-email',
			validators: []
		},
		email: {
			type: 'single-line-input',
			title: 'Email Address',
			question: 'What is your email address?',
			fieldName: 'email',
			url: 'email',
			validators: []
		},
		rating: {
			type: 'radio',
			title: 'Rating',
			question: 'How would you rate our service?',
			fieldName: 'rating',
			url: 'rating',
			validators: [],
			options: [
				{ text: '1 - Poor', value: '1' },
				{ text: '5 - Excellent', value: '5' }
			]
		},
		feedback: {
			type: 'text-entry',
			title: 'Feedback',
			question: 'Please provide your feedback',
			fieldName: 'feedback',
			url: 'feedback',
			validators: []
		}
	};

	const mockResponse = {
		answers: {
			fullName: 'John Doe',
			rating: 'excellent'
		}
	};

	describe('JOURNEY_ID', () => {
		it('should export correct journey identifier', () => {
			assert.strictEqual(JOURNEY_ID, 'questionnaire');
		});
	});

	describe('createJourney', () => {
		it('should create journey with correct configuration', () => {
			const mockReq = {
				baseUrl: '/questionnaire'
			};

			const journey = createJourney(mockQuestions, mockResponse, mockReq as any);

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
			const mockReq = {
				baseUrl: '/questionnaire'
			};

			assert.doesNotThrow(() => {
				createJourney(mockQuestions, mockResponse, mockReq as any);
			});
		});

		it('should throw error for invalid request URL', () => {
			const mockReq = {
				baseUrl: '/invalid-path'
			};

			assert.throws(() => {
				createJourney(mockQuestions, mockResponse, mockReq as any);
			}, /Invalid journey request for 'questionnaire' journey/);
		});

		it('should handle different questionnaire base URLs', () => {
			const validUrls = ['/questionnaire', '/some/path/questionnaire', '/app/questionnaire'];

			validUrls.forEach((url) => {
				const mockReq = { baseUrl: url };
				assert.doesNotThrow(() => {
					createJourney(mockQuestions, mockResponse, mockReq as any);
				}, `Should accept URL: ${url}`);
			});
		});

		it('should reject URLs not ending with questionnaire', () => {
			const invalidUrls = ['/questionnaire/extra', '/questionnaires', '/question', '/other-path'];

			invalidUrls.forEach((url) => {
				const mockReq = { baseUrl: url };
				assert.throws(
					() => {
						createJourney(mockQuestions, mockResponse, mockReq as any);
					},
					/Invalid journey request/,
					`Should reject URL: ${url}`
				);
			});
		});

		it('should create baseUrl function correctly', () => {
			const mockReq = {
				baseUrl: '/test/questionnaire'
			};

			const journey = createJourney(mockQuestions, mockResponse, mockReq as any);
			const baseUrlFn = journey.makeBaseUrl;

			assert.strictEqual(typeof baseUrlFn, 'function');
			assert.strictEqual(baseUrlFn(), '/test/questionnaire');
		});

		it('should pass response data to journey', () => {
			const mockReq = {
				baseUrl: '/questionnaire'
			};

			const customResponse = {
				answers: { fullName: 'Jane Doe' },
				customData: 'test'
			};

			const journey = createJourney(mockQuestions, customResponse, mockReq as any);
			assert.strictEqual(journey.response, customResponse);
		});

		it('should handle empty questions object', () => {
			const mockReq = {
				baseUrl: '/questionnaire'
			};

			// Empty questions should throw because sections need valid questions
			assert.throws(() => {
				createJourney({}, mockResponse, mockReq as any);
			}, /question is required/);
		});

		it('should handle null/undefined response', () => {
			const mockReq = {
				baseUrl: '/questionnaire'
			};

			assert.doesNotThrow(() => {
				createJourney(mockQuestions, null, mockReq as any);
			});

			assert.doesNotThrow(() => {
				createJourney(mockQuestions, undefined, mockReq as any);
			});
		});
	});
});
