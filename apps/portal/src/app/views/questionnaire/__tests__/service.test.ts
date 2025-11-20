import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { SessionManager, QuestionnaireService } from '../core/service.ts';

describe('SessionManager', () => {
	it('should store submission data in session', () => {
		const mockReq = { session: {} };
		const submission = {
			id: 'test-id',
			reference: 'test-ref',
			answers: { fullName: 'Test' },
			submittedAt: new Date()
		};

		SessionManager.store(mockReq, submission);

		assert.strictEqual(mockReq.session.questionnaires.lastReference, 'test-ref');
		assert.strictEqual(mockReq.session.questionnaires.submitted, true);
	});

	it('should retrieve session data', () => {
		const mockReq = {
			session: {
				questionnaires: {
					lastReference: 'test-ref',
					submitted: true
				}
			}
		};

		const data = SessionManager.get(mockReq);

		assert.strictEqual(data.reference, 'test-ref');
		assert.strictEqual(data.submitted, true);
	});

	it('should clear session data', () => {
		const mockReq = {
			session: {
				questionnaires: {
					lastReference: 'test-ref',
					submitted: true
				}
			}
		};

		SessionManager.clear(mockReq);

		assert.strictEqual(mockReq.session.questionnaires.lastReference, undefined);
		assert.strictEqual(mockReq.session.questionnaires.submitted, undefined);
	});

	it('should set error in session', () => {
		const mockReq = { session: {} };
		const errorMsg = 'Test error';

		SessionManager.setError(mockReq, errorMsg);

		assert.strictEqual(mockReq.session.questionnaires.error, errorMsg);
	});
});

describe('QuestionnaireService', () => {
	it('should save submission and return result', async () => {
		const mockLogger = {
			info: mock.fn(),
			error: mock.fn(),
			debug: mock.fn(),
			warn: mock.fn()
		};

		const mockRepository = {
			save: mock.fn(async () => ({
				id: 'saved-id',
				createdAt: new Date('2024-01-01')
			}))
		};

		const service = new QuestionnaireService(mockLogger, mockRepository as any);
		const answers = { fullName: 'Test User', email: 'test@example.com' };

		const result = await service.saveSubmission(answers);

		assert.strictEqual(mockRepository.save.mock.callCount(), 1);
		assert.strictEqual(mockRepository.save.mock.calls[0].arguments[0], answers);
		assert.strictEqual(result.id, 'saved-id');
		assert.strictEqual(result.reference, 'saved-id');
		assert.strictEqual(result.answers, answers);
		assert.strictEqual(mockLogger.info.mock.callCount(), 1);
	});

	it('should send notification', async () => {
		const mockLogger = {
			info: mock.fn(),
			error: mock.fn(),
			debug: mock.fn(),
			warn: mock.fn()
		};

		const service = new QuestionnaireService(mockLogger, {} as any);
		const submission = {
			id: 'test-id',
			reference: 'test-ref',
			answers: { email: 'test@example.com' },
			submittedAt: new Date()
		};

		await service.sendNotification(submission);

		assert.strictEqual(mockLogger.info.mock.callCount(), 1);
		const logCall = mockLogger.info.mock.calls[0].arguments;
		assert.strictEqual(logCall[0].reference, 'test-ref');
		assert.strictEqual(logCall[0].email, 'test@example.com');
		assert.strictEqual(logCall[1], 'Sending notification');
	});
});
