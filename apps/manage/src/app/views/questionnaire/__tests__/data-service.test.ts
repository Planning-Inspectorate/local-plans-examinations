import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { QuestionnaireService } from '../data/service.ts';
import { mockLogger } from '@pins/local-plans-lib/testing/mock-logger.ts';

describe('QuestionnaireService (data)', () => {
	const mockRepository = {
		count: mock.fn(() => Promise.resolve(8)),
		findMany: mock.fn(() =>
			Promise.resolve([
				{ id: 'test-1', fullName: 'User 1', email: 'user1@test.com' },
				{ id: 'test-2', fullName: 'User 2', email: null }
			])
		),
		findById: mock.fn(() => Promise.resolve({ id: 'test-1', fullName: 'Test User', email: 'test@example.com' }))
	};

	const mockDatabaseService = {
		createAdapter: mock.fn(() => mockRepository)
	};

	describe('getTotalSubmissions', () => {
		it('should return count from repository with active filter', async () => {
			const service = new QuestionnaireService(mockDatabaseService, mockLogger());
			const result = await service.getTotalSubmissions();

			assert.strictEqual(result, 8);
			assert.strictEqual(mockRepository.count.mock.callCount(), 1);
			assert.deepStrictEqual(mockRepository.count.mock.calls[0].arguments[0], { isDeleted: false });
		});
	});

	describe('getAllSubmissions', () => {
		it('should return all active submissions from repository', async () => {
			const service = new QuestionnaireService(mockDatabaseService, mockLogger());
			const result = await service.getAllSubmissions();

			assert.strictEqual(result.length, 2);
			assert.strictEqual(result[0].id, 'test-1');
			assert.strictEqual(mockRepository.findMany.mock.callCount(), 1);
			assert.deepStrictEqual(mockRepository.findMany.mock.calls[0].arguments[0], { isDeleted: false });
		});
	});

	describe('getSubmissionById', () => {
		it('should return single submission by ID', async () => {
			const service = new QuestionnaireService(mockDatabaseService, mockLogger());
			const result = await service.getSubmissionById('test-1');

			assert.strictEqual(result.id, 'test-1');
			assert.strictEqual(result.fullName, 'Test User');
			assert.strictEqual(mockRepository.findById.mock.callCount(), 1);
			assert.strictEqual(mockRepository.findById.mock.calls[0].arguments[0], 'test-1');
		});
	});
});
