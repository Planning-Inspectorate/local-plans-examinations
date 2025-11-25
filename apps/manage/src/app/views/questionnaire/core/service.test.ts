import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { QuestionnaireService } from './service.ts';
import { mockLogger } from '@pins/local-plans-lib/testing/mock-logger.ts';

describe('QuestionnaireService (core)', () => {
	const mockDataService = {
		getTotalSubmissions: mock.fn(() => Promise.resolve(10)),
		getAllSubmissions: mock.fn(() =>
			Promise.resolve([
				{ id: 'test-1', fullName: 'User 1' },
				{ id: 'test-2', fullName: 'User 2' }
			])
		),
		getSubmissionById: mock.fn(() =>
			Promise.resolve({ id: 'test-1', fullName: 'Test User', email: 'test@example.com' })
		)
	};

	describe('getTotalSubmissions', () => {
		it('should return total count from data service', async () => {
			const service = new QuestionnaireService(mockLogger(), mockDataService);
			const result = await service.getTotalSubmissions();

			assert.strictEqual(result, 10);
			assert.strictEqual(mockDataService.getTotalSubmissions.mock.callCount(), 1);
		});
	});

	describe('getAllSubmissions', () => {
		it('should return all submissions from data service', async () => {
			const service = new QuestionnaireService(mockLogger(), mockDataService);
			const result = await service.getAllSubmissions();

			assert.strictEqual(result.length, 2);
			assert.strictEqual(result[0].id, 'test-1');
			assert.strictEqual(mockDataService.getAllSubmissions.mock.callCount(), 1);
		});
	});

	describe('getSubmissionById', () => {
		it('should return single submission from data service', async () => {
			const service = new QuestionnaireService(mockLogger(), mockDataService);
			const result = await service.getSubmissionById('test-1');

			assert.strictEqual(result.id, 'test-1');
			assert.strictEqual(result.fullName, 'Test User');
			assert.strictEqual(mockDataService.getSubmissionById.mock.callCount(), 1);
		});
	});
});
