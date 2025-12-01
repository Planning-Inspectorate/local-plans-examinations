import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createQuestionnaireService, sessionStore, sessionGet, sessionClear, sessionSetError } from './service.ts';
import type { QuestionnaireAnswers } from './service.ts';

describe('QuestionnaireService', () => {
	let mockLogger: any;
	let mockDataService: any;

	beforeEach(() => {
		mockLogger = {
			info: mock.fn(),
			debug: mock.fn(),
			error: mock.fn(),
			warn: mock.fn()
		};

		mockDataService = {
			saveSubmission: mock.fn(),
			getTotalSubmissions: mock.fn()
		};
	});

	const testAnswers: QuestionnaireAnswers = {
		fullName: 'John Doe',
		email: 'john@example.com',
		wantToProvideEmail: true,
		rating: 'excellent',
		feedback: 'Great service!'
	};

	describe('saveSubmission', () => {
		it('should save submission and return formatted result', async () => {
			const dbResult = {
				id: 'test-id-123',
				createdAt: new Date('2024-01-01T00:00:00Z')
			};

			mockDataService.saveSubmission.mock.mockImplementation(() => Promise.resolve(dbResult));

			const service = createQuestionnaireService(mockLogger, mockDataService);
			const result = await service.saveSubmission(testAnswers);

			assert.deepStrictEqual(result, {
				id: 'test-id-123',
				reference: 'test-id-123',
				answers: testAnswers,
				submittedAt: dbResult.createdAt
			});

			assert.strictEqual(mockDataService.saveSubmission.mock.callCount(), 1);
			assert.ok(mockLogger.info.mock.callCount() >= 1);
		});

		it('should propagate data service errors', async () => {
			const serviceError = new Error('Data service failed');
			mockDataService.saveSubmission.mock.mockImplementation(() => Promise.reject(serviceError));

			const service = createQuestionnaireService(mockLogger, mockDataService);

			await assert.rejects(() => service.saveSubmission(testAnswers), serviceError);
		});
	});

	describe('sendNotification', () => {
		it('should log notification details', async () => {
			const submission = {
				id: 'test-id-123',
				reference: 'test-ref-123',
				answers: testAnswers,
				submittedAt: new Date()
			};

			const service = createQuestionnaireService(mockLogger, mockDataService);
			await service.sendNotification(submission);

			assert.ok(mockLogger.info.mock.callCount() >= 1);
			const logCall = mockLogger.info.mock.calls[0];
			assert.deepStrictEqual(logCall.arguments[0], {
				reference: 'test-ref-123',
				email: 'john@example.com'
			});
		});
	});

	describe('getTotalSubmissions', () => {
		it('should return total submissions count', async () => {
			const expectedCount = 25;
			mockDataService.getTotalSubmissions.mock.mockImplementation(() => Promise.resolve(expectedCount));

			const service = createQuestionnaireService(mockLogger, mockDataService);
			const result = await service.getTotalSubmissions();

			assert.strictEqual(result, expectedCount);
			assert.ok(mockDataService.getTotalSubmissions.mock.callCount() >= 1);
			assert.ok(mockLogger.info.mock.callCount() >= 1);
		});
	});
});

describe('Session Management', () => {
	let mockRequest: any;

	beforeEach(() => {
		mockRequest = {
			session: {}
		};
	});

	describe('sessionStore', () => {
		it('should store submission data in session', () => {
			const submission = { reference: 'test-ref-123' };

			sessionStore(mockRequest, submission);

			assert.strictEqual(mockRequest.session.questionnaires.lastReference, 'test-ref-123');
			assert.strictEqual(mockRequest.session.questionnaires.submitted, true);
		});
	});

	describe('sessionGet', () => {
		it('should retrieve session data', () => {
			mockRequest.session.questionnaires = {
				lastReference: 'test-ref-456',
				submitted: true,
				error: 'test error'
			};

			const result = sessionGet(mockRequest);

			assert.deepStrictEqual(result, {
				reference: 'test-ref-456',
				submitted: true,
				error: 'test error'
			});
		});

		it('should return empty data when session is empty', () => {
			const result = sessionGet(mockRequest);

			assert.deepStrictEqual(result, {
				reference: undefined,
				submitted: undefined,
				error: undefined
			});
		});
	});

	describe('sessionClear', () => {
		it('should clear session data', () => {
			mockRequest.session.questionnaires = {
				lastReference: 'test-ref-789',
				submitted: true,
				error: 'some error'
			};

			sessionClear(mockRequest);

			assert.strictEqual(mockRequest.session.questionnaires.lastReference, undefined);
			assert.strictEqual(mockRequest.session.questionnaires.submitted, undefined);
			assert.strictEqual(mockRequest.session.questionnaires.error, undefined);
		});

		it('should handle missing session gracefully', () => {
			sessionClear(mockRequest);
			// Should not throw error
			assert.ok(true);
		});
	});

	describe('sessionSetError', () => {
		it('should set error in session', () => {
			sessionSetError(mockRequest, 'Test error message');

			assert.strictEqual(mockRequest.session.questionnaires.error, 'Test error message');
		});
	});
});
