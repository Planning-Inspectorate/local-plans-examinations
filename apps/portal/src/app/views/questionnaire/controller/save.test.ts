import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createSaveController } from './save.ts';
import type { QuestionnaireAnswers, QuestionnaireSubmission } from '../core/service.ts';

describe('SaveController', () => {
	const mockLogger = {
		info: mock.fn(),
		warn: mock.fn(),
		error: mock.fn()
	};

	const mockService = {
		saveSubmission: mock.fn(),
		sendNotification: mock.fn()
	};

	const mockPortalService = {
		logger: mockLogger
	};

	const testAnswers: QuestionnaireAnswers = {
		fullName: 'John Doe',
		email: 'john@example.com',
		wantToProvideEmail: true,
		rating: 'excellent',
		feedback: 'Great service!'
	};

	const testSubmission: QuestionnaireSubmission = {
		id: 'test-id-123',
		reference: 'test-ref-123',
		answers: testAnswers,
		submittedAt: new Date()
	};

	let mockRequest: any;
	let mockResponse: any;

	beforeEach(() => {
		mockRequest = {
			session: {}
		};

		mockResponse = {
			locals: {
				journeyResponse: {
					answers: testAnswers
				},
				journey: {
					isComplete: mock.fn(() => true)
				}
			},
			redirect: mock.fn()
		};

		// Reset all mocks
		mockLogger.info.mock.resetCalls();
		mockLogger.warn.mock.resetCalls();
		mockLogger.error.mock.resetCalls();
		mockService.saveSubmission.mock.resetCalls();
		mockService.sendNotification.mock.resetCalls();
		mockResponse.redirect.mock.resetCalls();
	});

	describe('successful submission', () => {
		it('should process complete submission workflow', async () => {
			mockService.saveSubmission.mock.mockImplementation(() => Promise.resolve(testSubmission));
			mockService.sendNotification.mock.mockImplementation(() => Promise.resolve());

			const controller = createSaveController(mockService as any, mockPortalService as any);
			await controller(mockRequest, mockResponse);

			// Verify service calls
			assert.strictEqual(mockService.saveSubmission.mock.callCount(), 1);
			assert.strictEqual(mockService.sendNotification.mock.callCount(), 1);

			// Verify redirect to success page
			assert.strictEqual(mockResponse.redirect.mock.callCount(), 1);
			assert.strictEqual(mockResponse.redirect.mock.calls[0].arguments[0], '/questionnaire/success');

			// Verify logging
			assert.strictEqual(mockLogger.info.mock.callCount(), 2);
		});
	});

	describe('validation errors', () => {
		it('should redirect when journey is not complete', async () => {
			mockResponse.locals.journey.isComplete.mock.mockImplementation(() => false);

			const controller = createSaveController(mockService as any, mockPortalService as any);
			await controller(mockRequest, mockResponse);

			assert.strictEqual(mockResponse.redirect.mock.callCount(), 1);
			assert.strictEqual(mockResponse.redirect.mock.calls[0].arguments[0], '/questionnaire/check-your-answers');
			assert.strictEqual(mockLogger.warn.mock.callCount(), 1);
		});

		it('should redirect when no answers provided', async () => {
			mockResponse.locals.journeyResponse.answers = null;

			const controller = createSaveController(mockService as any, mockPortalService as any);
			await controller(mockRequest, mockResponse);

			assert.strictEqual(mockResponse.redirect.mock.callCount(), 1);
			assert.strictEqual(mockResponse.redirect.mock.calls[0].arguments[0], '/questionnaire');
			assert.strictEqual(mockLogger.warn.mock.callCount(), 1);
		});

		it('should redirect when answers are empty', async () => {
			mockResponse.locals.journeyResponse.answers = {};

			const controller = createSaveController(mockService as any, mockPortalService as any);
			await controller(mockRequest, mockResponse);

			assert.strictEqual(mockResponse.redirect.mock.callCount(), 1);
			assert.strictEqual(mockResponse.redirect.mock.calls[0].arguments[0], '/questionnaire');
		});
	});

	describe('error handling', () => {
		it('should handle service errors gracefully', async () => {
			const serviceError = new Error('Database connection failed');
			mockService.saveSubmission.mock.mockImplementation(() => Promise.reject(serviceError));

			const controller = createSaveController(mockService as any, mockPortalService as any);
			await controller(mockRequest, mockResponse);

			// Should redirect to check answers page
			assert.strictEqual(mockResponse.redirect.mock.callCount(), 1);
			assert.strictEqual(mockResponse.redirect.mock.calls[0].arguments[0], '/questionnaire/check-your-answers');

			// Should log error
			assert.strictEqual(mockLogger.error.mock.callCount(), 1);
			assert.ok(mockLogger.error.mock.calls[0].arguments[0].includes('Database connection failed'));
		});

		it('should handle non-Error exceptions', async () => {
			mockService.saveSubmission.mock.mockImplementation(() => Promise.reject('String error'));

			const controller = createSaveController(mockService as any, mockPortalService as any);
			await controller(mockRequest, mockResponse);

			assert.strictEqual(mockResponse.redirect.mock.callCount(), 1);
			assert.strictEqual(mockLogger.error.mock.callCount(), 1);
			assert.ok(mockLogger.error.mock.calls[0].arguments[0].includes('String error'));
		});
	});

	describe('session management', () => {
		it('should store submission in session', async () => {
			mockService.saveSubmission.mock.mockImplementation(() => Promise.resolve(testSubmission));
			mockService.sendNotification.mock.mockImplementation(() => Promise.resolve());

			const controller = createSaveController(mockService as any, mockPortalService as any);
			await controller(mockRequest, mockResponse);

			// Verify session was updated
			assert.strictEqual(mockRequest.session.questionnaires.lastReference, 'test-ref-123');
			assert.strictEqual(mockRequest.session.questionnaires.submitted, true);
		});

		it('should set error in session on failure', async () => {
			mockService.saveSubmission.mock.mockImplementation(() => Promise.reject(new Error('Test error')));

			const controller = createSaveController(mockService as any, mockPortalService as any);
			await controller(mockRequest, mockResponse);

			assert.strictEqual(
				mockRequest.session.questionnaires.error,
				'There was a problem submitting your questionnaire. Please try again.'
			);
		});
	});
});
