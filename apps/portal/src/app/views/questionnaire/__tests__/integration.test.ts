import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { createQuestionnaireControllers } from '../controller.ts';
import { SessionManager, QuestionnaireService } from '../core/service.ts';
import { PrismaQuestionnaireRepository } from '../repository.ts';

describe('Questionnaire Integration', () => {
	it('should handle complete submission flow', async () => {
		const mockDb = {
			questionnaire: {
				create: mock.fn(async () => ({
					id: 'integration-test-id',
					createdAt: new Date('2024-01-01')
				}))
			}
		};

		const mockLogger = {
			info: mock.fn(),
			error: mock.fn(),
			debug: mock.fn(),
			warn: mock.fn()
		};

		const repository = new PrismaQuestionnaireRepository(mockDb as any, mockLogger);
		const service = new QuestionnaireService(mockLogger, repository);

		const answers = {
			fullName: 'Integration Test User',
			email: 'integration@test.com',
			rating: 'excellent',
			feedback: 'Integration test feedback'
		};

		const submission = await service.saveSubmission(answers);

		assert.strictEqual(submission.id, 'integration-test-id');
		assert.strictEqual(submission.reference, 'integration-test-id');
		assert.deepStrictEqual(submission.answers, answers);
		assert.strictEqual(mockDb.questionnaire.create.mock.callCount(), 1);
		assert.strictEqual(mockLogger.info.mock.callCount(), 2); // Repository + Service logs
	});

	it('should handle session management in controller flow', () => {
		const mockReq = { session: {} };
		const submission = {
			id: 'session-test-id',
			reference: 'session-ref',
			answers: { fullName: 'Session Test' },
			submittedAt: new Date()
		};

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

	it('should integrate controller with service dependencies', () => {
		const mockService = {
			logger: {
				info: mock.fn(),
				error: mock.fn(),
				debug: mock.fn(),
				warn: mock.fn()
			},
			db: {
				questionnaire: {
					create: mock.fn()
				}
			}
		};

		const controllers = createQuestionnaireControllers(mockService as any);

		// Test controller creation and dependency injection
		assert.ok(typeof controllers.startJourney === 'function');
		assert.ok(typeof controllers.viewSuccessPage === 'function');
		assert.ok(controllers.questionnaireService instanceof QuestionnaireService);

		// Test start journey renders correctly
		let renderCalled = false;
		let renderData: any;
		const mockRes = {
			render: (template: string, data: any) => {
				renderCalled = true;
				renderData = data;
			}
		};

		controllers.startJourney({} as any, mockRes as any);
		assert.strictEqual(renderCalled, true);
		assert.strictEqual(renderData.pageTitle, 'Local Plans Questionnaire');
		assert.strictEqual(mockService.logger.info.mock.callCount(), 1);
	});

	it('should handle error scenarios in service layer', async () => {
		const mockDb = {
			questionnaire: {
				create: mock.fn(async () => {
					throw new Error('Database error');
				})
			}
		};

		const mockLogger = {
			info: mock.fn(),
			error: mock.fn(),
			debug: mock.fn(),
			warn: mock.fn()
		};

		const repository = new PrismaQuestionnaireRepository(mockDb as any, mockLogger);
		const service = new QuestionnaireService(mockLogger, repository);

		const answers = { fullName: 'Error Test' };

		try {
			await service.saveSubmission(answers);
			assert.fail('Should have thrown error');
		} catch (error) {
			assert.ok(error instanceof Error);
			assert.strictEqual(error.message, 'Database error');
		}
	});
});
