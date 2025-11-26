import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SessionManager, QuestionnaireService } from './service.ts';
import {
	createTestSubmission,
	createTestAnswers,
	createMockRequest,
	createMockRepository,
	SessionDataBuilder,
	AssertionHelpers
} from '../test-helpers.ts';
import { mockLogger } from '@pins/local-plans-lib/testing/mock-logger.ts';

describe('SessionManager', () => {
	describe('store()', () => {
		it('should store submission data in session', () => {
			const mockReq = createMockRequest();
			const submission = createTestSubmission();

			SessionManager.store(mockReq, submission);

			assert.strictEqual(mockReq.session.questionnaires.lastReference, submission.reference);
			assert.strictEqual(mockReq.session.questionnaires.submitted, true);
		});

		it('should create session namespace if not exists', () => {
			const mockReq = createMockRequest();
			const submission = createTestSubmission();

			SessionManager.store(mockReq, submission);

			assert.ok(mockReq.session.questionnaires);
		});
	});

	describe('get()', () => {
		it('should retrieve session data when exists', () => {
			const sessionData = SessionDataBuilder.withSubmission('test-ref');
			const mockReq = createMockRequest(sessionData);

			const data = SessionManager.get(mockReq);

			assert.strictEqual(data.reference, 'test-ref');
			assert.strictEqual(data.submitted, true);
		});

		it('should return empty object when no session data', () => {
			const mockReq = createMockRequest();

			const data = SessionManager.get(mockReq);

			assert.strictEqual(data.reference, undefined);
			assert.strictEqual(data.submitted, undefined);
		});

		it('should retrieve error from session', () => {
			const sessionData = SessionDataBuilder.withError('Test error');
			const mockReq = createMockRequest(sessionData);

			const data = SessionManager.get(mockReq);

			assert.strictEqual(data.error, 'Test error');
		});
	});

	describe('clear()', () => {
		it('should clear session data when exists', () => {
			const sessionData = SessionDataBuilder.withSubmission();
			const mockReq = createMockRequest(sessionData);

			SessionManager.clear(mockReq);

			assert.strictEqual(mockReq.session.questionnaires.lastReference, undefined);
			assert.strictEqual(mockReq.session.questionnaires.submitted, undefined);
		});

		it('should handle clearing when no session data exists', () => {
			const mockReq = createMockRequest();

			// Should not throw
			SessionManager.clear(mockReq);

			assert.ok(true, 'Clear should handle missing session gracefully');
		});
	});

	describe('setError()', () => {
		it('should set error in session', () => {
			const mockReq = createMockRequest();
			const errorMsg = 'Test error message';

			SessionManager.setError(mockReq, errorMsg);

			assert.strictEqual(mockReq.session.questionnaires.error, errorMsg);
		});

		it('should create session namespace when setting error', () => {
			const mockReq = createMockRequest();

			SessionManager.setError(mockReq, 'Error');

			assert.ok(mockReq.session.questionnaires);
		});
	});
});

describe('QuestionnaireService', () => {
	let mockLoggerInstance: ReturnType<typeof mockLogger>;
	let mockRepository: ReturnType<typeof createMockRepository>;
	let service: QuestionnaireService;

	const setupService = (repositoryOverrides = {}) => {
		mockLoggerInstance = mockLogger();
		mockRepository = createMockRepository(repositoryOverrides);
		service = new QuestionnaireService(mockLoggerInstance, mockRepository as any);
	};

	describe('saveSubmission()', () => {
		it('should save submission and return formatted result', async () => {
			setupService({
				saveSubmission: async () => ({ id: 'saved-id', createdAt: new Date('2024-01-01') })
			});
			const answers = createTestAnswers();

			const result = await service.saveSubmission(answers);

			AssertionHelpers.assertMockCalled(mockRepository.saveSubmission, 1, [answers]);
			assert.strictEqual(result.id, 'saved-id');
			assert.strictEqual(result.reference, 'saved-id');
			assert.deepStrictEqual(result.answers, answers);
			AssertionHelpers.assertMockCalled(mockLoggerInstance.info, 1);
		});

		it('should handle repository errors', async () => {
			const error = new Error('Database connection failed');
			setupService({
				saveSubmission: async () => {
					throw error;
				}
			});

			await assert.rejects(() => service.saveSubmission(createTestAnswers()), error);
		});
	});

	describe('sendNotification()', () => {
		it('should log notification details', async () => {
			setupService();
			const submission = createTestSubmission({ answers: { ...createTestAnswers(), email: 'notify@test.com' } });

			await service.sendNotification(submission);

			AssertionHelpers.assertMockCalled(mockLoggerInstance.info, 1);
			const logCall = mockLoggerInstance.info.mock.calls[0].arguments;
			assert.strictEqual(logCall[0].reference, submission.reference);
			assert.strictEqual(logCall[0].email, 'notify@test.com');
			assert.strictEqual(logCall[1], 'Sending notification');
		});
	});

	describe('getTotalSubmissions()', () => {
		it('should return count from repository', async () => {
			setupService({ getTotalSubmissions: async () => 123 });

			const count = await service.getTotalSubmissions();

			assert.strictEqual(count, 123);
			AssertionHelpers.assertMockCalled(mockRepository.getTotalSubmissions, 1);
			AssertionHelpers.assertMockCalled(mockLoggerInstance.info, 1);
		});

		it('should handle zero count', async () => {
			setupService({ getTotalSubmissions: async () => 0 });

			const count = await service.getTotalSubmissions();

			assert.strictEqual(count, 0);
		});
	});
});
