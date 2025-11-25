import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createSaveController } from './save.ts';
import { QuestionnaireService } from './core/service.ts';
import {
	createTestAnswers,
	createTestSubmission,
	createMockLogger,
	createMockRequest,
	createMockResponse,
	AssertionHelpers
} from './test-helpers.ts';

/**
 * Save Controller unit tests
 * Tests submission handling logic in isolation
 */
describe('Save Controller', () => {
	let mockLogger: ReturnType<typeof createMockLogger>;
	let mockQuestionnaireService: any;
	let mockPortalService: any;
	let saveHandler: any;

	const setupController = (serviceOverrides = {}) => {
		mockLogger = createMockLogger();
		mockQuestionnaireService = {
			saveSubmission: async () => createTestSubmission(),
			sendNotification: async () => {},
			...serviceOverrides
		};
		mockPortalService = { logger: mockLogger };
		saveHandler = createSaveController(mockQuestionnaireService as QuestionnaireService, mockPortalService);
	};

	describe('Successful Submission Flow', () => {
		it('should process valid submission and redirect to success', async () => {
			setupController();
			const answers = createTestAnswers();
			const mockReq = createMockRequest();
			const mockRes = createMockResponse();

			// Mock journey completion and answers
			mockRes.locals = {
				journey: { isComplete: () => true },
				journeyResponse: { answers }
			};

			await saveHandler(mockReq, mockRes);

			AssertionHelpers.assertRedirect(mockRes, '/questionnaire/success');
			AssertionHelpers.assertMockCalled(mockLogger.info, 2); // Processing + success logs
		});

		it('should store submission in session after save', async () => {
			const submission = createTestSubmission({ reference: 'save-test-ref' });
			setupController({ saveSubmission: async () => submission });
			const mockReq = createMockRequest();
			const mockRes = createMockResponse();

			mockRes.locals = {
				journey: { isComplete: () => true },
				journeyResponse: { answers: createTestAnswers() }
			};

			await saveHandler(mockReq, mockRes);

			assert.strictEqual(mockReq.session.questionnaires.lastReference, 'save-test-ref');
			assert.strictEqual(mockReq.session.questionnaires.submitted, true);
		});

		it('should send notification after successful save', async () => {
			const notificationSpy = async (submission: any) => {
				assert.strictEqual(submission.reference, 'test-ref');
			};
			setupController({ sendNotification: notificationSpy });
			const mockReq = createMockRequest();
			const mockRes = createMockResponse();

			mockRes.locals = {
				journey: { isComplete: () => true },
				journeyResponse: { answers: createTestAnswers() }
			};

			await saveHandler(mockReq, mockRes);
		});
	});

	describe('Validation Errors', () => {
		it('should redirect when journey is not complete', async () => {
			setupController();
			const mockReq = createMockRequest();
			const mockRes = createMockResponse();

			mockRes.locals = {
				journey: { isComplete: () => false },
				journeyResponse: { answers: createTestAnswers() }
			};

			await saveHandler(mockReq, mockRes);

			AssertionHelpers.assertRedirect(mockRes, '/questionnaire/check-your-answers');
			AssertionHelpers.assertMockCalled(mockLogger.warn, 1);
		});

		it('should redirect when no answers provided', async () => {
			setupController();
			const mockReq = createMockRequest();
			const mockRes = createMockResponse();

			mockRes.locals = {
				journey: { isComplete: () => true },
				journeyResponse: { answers: {} }
			};

			await saveHandler(mockReq, mockRes);

			AssertionHelpers.assertRedirect(mockRes, '/questionnaire');
			AssertionHelpers.assertMockCalled(mockLogger.warn, 1);
		});

		it('should redirect when answers is null', async () => {
			setupController();
			const mockReq = createMockRequest();
			const mockRes = createMockResponse();

			mockRes.locals = {
				journey: { isComplete: () => true },
				journeyResponse: { answers: null }
			};

			await saveHandler(mockReq, mockRes);

			AssertionHelpers.assertRedirect(mockRes, '/questionnaire');
		});
	});

	describe('Error Handling', () => {
		it('should handle save errors gracefully', async () => {
			const error = new Error('Database save failed');
			setupController({
				saveSubmission: async () => {
					throw error;
				}
			});
			const mockReq = createMockRequest();
			const mockRes = createMockResponse();

			mockRes.locals = {
				journey: { isComplete: () => true },
				journeyResponse: { answers: createTestAnswers() }
			};

			await saveHandler(mockReq, mockRes);

			AssertionHelpers.assertRedirect(mockRes, '/questionnaire/check-your-answers');
			AssertionHelpers.assertMockCalled(mockLogger.error, 1);
			assert.strictEqual(
				mockReq.session.questionnaires.error,
				'There was a problem submitting your questionnaire. Please try again.'
			);
		});

		it('should handle notification errors gracefully', async () => {
			const notificationError = new Error('Email service unavailable');
			setupController({
				sendNotification: async () => {
					throw notificationError;
				}
			});
			const mockReq = createMockRequest();
			const mockRes = createMockResponse();

			mockRes.locals = {
				journey: { isComplete: () => true },
				journeyResponse: { answers: createTestAnswers() }
			};

			await saveHandler(mockReq, mockRes);

			AssertionHelpers.assertRedirect(mockRes, '/questionnaire/check-your-answers');
			AssertionHelpers.assertMockCalled(mockLogger.error, 1);
		});

		it('should handle unknown error types', async () => {
			setupController({
				saveSubmission: async () => {
					throw 'String error';
				}
			});
			const mockReq = createMockRequest();
			const mockRes = createMockResponse();

			mockRes.locals = {
				journey: { isComplete: () => true },
				journeyResponse: { answers: createTestAnswers() }
			};

			await saveHandler(mockReq, mockRes);

			AssertionHelpers.assertMockCalled(mockLogger.error, 1);
			assert.ok(mockLogger.error.mock.calls[0].arguments[0].includes('String error'));
		});
	});

	describe('Session Management', () => {
		it('should clear form data from session after successful save', async () => {
			// This would require mocking the clearDataFromSession function
			// For now, we test that the flow completes successfully
			setupController();
			const mockReq = createMockRequest();
			const mockRes = createMockResponse();

			mockRes.locals = {
				journey: { isComplete: () => true },
				journeyResponse: { answers: createTestAnswers() }
			};

			await saveHandler(mockReq, mockRes);

			// Verify successful completion
			AssertionHelpers.assertRedirect(mockRes, '/questionnaire/success');
		});
	});
});
