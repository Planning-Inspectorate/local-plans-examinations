import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createQuestionnaireControllers } from './controller.ts';
import { SessionManager, QuestionnaireService } from './core/service.ts';
import { DatabaseService } from '@pins/local-plans-lib/database';
import { QuestionnaireService as QuestionnaireDataService } from './data/service.ts';
import {
	createTestAnswers,
	createTestSubmission,
	createMockLogger,
	createMockPortalService,
	SessionDataBuilder,
	AssertionHelpers
} from './test-helpers.ts';

/**
 * Questionnaire Integration Tests
 * Tests component interactions and end-to-end flows
 */
describe('Questionnaire Integration', () => {
	describe('Complete Submission Flow', () => {
		it('should handle end-to-end submission with all layers', async () => {
			const mockLogger = createMockLogger();
			const mockAdapter = {
				create: async () => ({ id: 'integration-test-id', createdAt: new Date('2024-01-01') }),
				count: async () => 1
			};
			const mockDatabaseService = {
				createAdapter: () => mockAdapter
			};

			const dataService = new QuestionnaireDataService(mockDatabaseService as DatabaseService, mockLogger);
			const businessService = new QuestionnaireService(mockLogger, dataService);

			const answers = createTestAnswers({
				fullName: 'Integration Test User',
				email: 'integration@test.com',
				rating: 'excellent',
				feedback: 'Integration test feedback'
			});

			const submission = await businessService.saveSubmission(answers);

			assert.strictEqual(submission.id, 'integration-test-id');
			assert.strictEqual(submission.reference, 'integration-test-id');
			assert.deepStrictEqual(submission.answers, answers);
			AssertionHelpers.assertMockCalled(mockLogger.info, 1); // Service log
		});

		it('should handle notification flow after submission', async () => {
			const mockLogger = createMockLogger();
			const mockDataService = {
				saveSubmission: async () => ({ id: 'notify-test-id', createdAt: new Date() }),
				getTotalSubmissions: async () => 1
			};

			const service = new QuestionnaireService(mockLogger, mockDataService as any);
			const submission = await service.saveSubmission(createTestAnswers());

			// Test notification (currently just logs)
			await service.sendNotification(submission);

			AssertionHelpers.assertMockCalled(mockLogger.info, 2); // Save + notification logs
		});
	});

	describe('Session Management Integration', () => {
		it('should handle complete session lifecycle', () => {
			const mockReq = { session: {} };
			const submission = createTestSubmission({
				id: 'session-test-id',
				reference: 'session-ref'
			});

			// Store submission
			SessionManager.store(mockReq, submission);
			let sessionData = SessionManager.get(mockReq);
			assert.strictEqual(sessionData.reference, 'session-ref');
			assert.strictEqual(sessionData.submitted, true);

			// Clear session
			SessionManager.clear(mockReq);
			sessionData = SessionManager.get(mockReq);
			assert.strictEqual(sessionData.reference, undefined);
			assert.strictEqual(sessionData.submitted, undefined);
		});

		it('should handle error scenarios in session management', () => {
			const mockReq = { session: {} };

			// Test error storage and retrieval
			SessionManager.setError(mockReq, 'Integration test error');
			const sessionData = SessionManager.get(mockReq);
			assert.strictEqual(sessionData.error, 'Integration test error');

			// Test clearing errors
			SessionManager.clear(mockReq);
			const clearedData = SessionManager.get(mockReq);
			assert.strictEqual(clearedData.error, undefined);
		});
	});

	describe('Controller Integration', () => {
		it('should integrate controller factory with all dependencies', () => {
			const mockService = createMockPortalService();
			const controllers = createQuestionnaireControllers(mockService as any);

			// Test controller creation and dependency injection
			assert.ok(typeof controllers.startJourney === 'function');
			assert.ok(typeof controllers.viewSuccessPage === 'function');
			assert.ok(controllers.questionnaireService instanceof QuestionnaireService);
		});
	});

	describe('Error Handling Integration', () => {
		it('should propagate errors through service layers', async () => {
			const mockLogger = createMockLogger();
			const error = new Error('Integration database error');
			const mockAdapter = {
				create: async () => {
					throw error;
				}
			};
			const mockDatabaseService = {
				createAdapter: () => mockAdapter
			};

			const dataService = new QuestionnaireDataService(mockDatabaseService as DatabaseService, mockLogger);
			const businessService = new QuestionnaireService(mockLogger, dataService);

			await assert.rejects(() => businessService.saveSubmission(createTestAnswers()), error);
		});

		it('should handle count operation errors', async () => {
			const mockLogger = createMockLogger();
			const error = new Error('Count operation failed');
			const mockAdapter = {
				count: async () => {
					throw error;
				}
			};
			const mockDatabaseService = {
				createAdapter: () => mockAdapter
			};

			const dataService = new QuestionnaireDataService(mockDatabaseService as DatabaseService, mockLogger);
			const businessService = new QuestionnaireService(mockLogger, dataService);

			await assert.rejects(() => businessService.getTotalSubmissions(), error);
		});
	});
});
