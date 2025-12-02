import { describe, it, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import type { Logger } from 'pino';
import { createQuestionnaireService, sessionStore, sessionGet, sessionClear, sessionSetError } from './service.ts';
import { createMockLogger, createMockRequest, TEST_DATA } from '../test-utils.ts';

describe('QuestionnaireService', () => {
	let mockLogger: Logger;
	let mockDataService: any;

	beforeEach(() => {
		mockLogger = createMockLogger() as unknown as Logger;
		mockDataService = {
			saveSubmission: mock.fn(),
			getTotalSubmissions: mock.fn()
		};
	});

	afterEach(() => {
		(mockLogger.info as any).mock.resetCalls();
		(mockLogger.warn as any).mock.resetCalls();
		(mockLogger.error as any).mock.resetCalls();
		(mockLogger.debug as any).mock.resetCalls();
		mockDataService.saveSubmission.mock.resetCalls();
		mockDataService.getTotalSubmissions.mock.resetCalls();
	});

	describe('saveSubmission', () => {
		it('should save submission and return formatted result', async () => {
			mockDataService.saveSubmission.mock.mockImplementation(() => Promise.resolve(TEST_DATA.dbResult));

			const service = createQuestionnaireService(mockLogger, mockDataService);
			const result = await service.saveSubmission(TEST_DATA.answers);

			assert.deepStrictEqual(result, {
				id: 'test-id-123',
				reference: 'test-id-123',
				answers: TEST_DATA.answers,
				submittedAt: TEST_DATA.dbResult.createdAt
			});

			assert.strictEqual(mockDataService.saveSubmission.mock.callCount(), 1);
			assert.ok((mockLogger.info as any).mock.callCount() >= 1);
		});

		it('should propagate data service errors', async () => {
			const serviceError = new Error('Data service failed');
			mockDataService.saveSubmission.mock.mockImplementation(() => Promise.reject(serviceError));

			const service = createQuestionnaireService(mockLogger, mockDataService);

			await assert.rejects(() => service.saveSubmission(TEST_DATA.answers), serviceError);
		});
	});

	describe('sendNotification', () => {
		it('should log notification details', async () => {
			const service = createQuestionnaireService(mockLogger, mockDataService);
			await service.sendNotification(TEST_DATA.submission);

			assert.ok((mockLogger.info as any).mock.callCount() >= 1);
			const logCall = (mockLogger.info as any).mock.calls[0];
			assert.deepStrictEqual(logCall.arguments[0], {
				reference: TEST_DATA.submission.reference,
				email: TEST_DATA.submission.answers.email
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
			assert.ok((mockLogger.info as any).mock.callCount() >= 1);
		});
	});
});

describe('Session Management', () => {
	let mockRequest: ReturnType<typeof createMockRequest>;

	beforeEach(() => {
		mockRequest = createMockRequest();
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
			assert.doesNotThrow(() => sessionClear(mockRequest));
		});
	});

	describe('sessionSetError', () => {
		it('should set error in session', () => {
			sessionSetError(mockRequest, 'Test error message');

			assert.strictEqual(mockRequest.session.questionnaires.error, 'Test error message');
		});
	});
});
