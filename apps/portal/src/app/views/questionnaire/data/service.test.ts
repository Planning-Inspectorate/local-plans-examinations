import { describe, it } from 'node:test';
import assert from 'node:assert';
import { QuestionnaireService } from './service.ts';
import { DatabaseService } from '@pins/local-plans-lib/database';
import { createTestAnswers, createMockLogger, AssertionHelpers } from '../test-helpers.ts';

/**
 * QuestionnaireService (Data Layer) unit tests
 * Tests data persistence operations in isolation
 */
describe('QuestionnaireService (Data Layer)', () => {
	let mockLogger: ReturnType<typeof createMockLogger>;
	let mockDatabaseService: any;
	let mockAdapter: any;
	let service: QuestionnaireService;

	const setupService = (adapterOverrides = {}) => {
		mockLogger = createMockLogger();
		mockAdapter = {
			create: async () => ({ id: 'data-test-id', createdAt: new Date('2024-01-01') }),
			count: async () => 50,
			...adapterOverrides
		};
		mockDatabaseService = {
			createAdapter: () => mockAdapter
		};
		service = new QuestionnaireService(mockDatabaseService as DatabaseService, mockLogger);
	};

	describe('saveSubmission()', () => {
		it('should map form data to database schema and save', async () => {
			setupService();
			const answers = createTestAnswers({ email: 'data@test.com' });

			const result = await service.saveSubmission(answers);

			assert.strictEqual(result.id, 'data-test-id');
			assert.deepStrictEqual(result.createdAt, new Date('2024-01-01'));
		});

		it('should handle optional email field', async () => {
			const createSpy = async (data: any) => {
				assert.strictEqual(data.email, null);
				return { id: 'test-id', createdAt: new Date() };
			};
			setupService({ create: createSpy });
			const answers = createTestAnswers({ email: '' });

			await service.saveSubmission(answers);
		});

		it('should map all required fields correctly', async () => {
			const createSpy = async (data: any) => {
				assert.strictEqual(data.fullName, 'Test User');
				assert.strictEqual(data.rating, 'excellent');
				assert.strictEqual(data.feedback, 'Great service');
				return { id: 'test-id', createdAt: new Date() };
			};
			setupService({ create: createSpy });
			const answers = createTestAnswers({
				fullName: 'Test User',
				rating: 'excellent',
				feedback: 'Great service'
			});

			await service.saveSubmission(answers);
		});

		it('should propagate database errors', async () => {
			const error = new Error('Database constraint violation');
			setupService({
				create: async () => {
					throw error;
				}
			});

			await assert.rejects(() => service.saveSubmission(createTestAnswers()), error);
		});
	});

	describe('getTotalSubmissions()', () => {
		it('should return count of non-deleted submissions', async () => {
			const countSpy = async (filter: any) => {
				assert.deepStrictEqual(filter, { isDeleted: false });
				return 75;
			};
			setupService({ count: countSpy });

			const count = await service.getTotalSubmissions();

			assert.strictEqual(count, 75);
		});

		it('should handle zero count', async () => {
			setupService({ count: async () => 0 });

			const count = await service.getTotalSubmissions();

			assert.strictEqual(count, 0);
		});

		it('should propagate database errors', async () => {
			const error = new Error('Database connection timeout');
			setupService({
				count: async () => {
					throw error;
				}
			});

			await assert.rejects(() => service.getTotalSubmissions(), error);
		});
	});

	describe('Database Adapter Integration', () => {
		it('should create adapter with correct table name', () => {
			mockDatabaseService = {
				createAdapter: (tableName: string) => {
					assert.strictEqual(tableName, 'questionnaire');
					return mockAdapter;
				}
			};

			new QuestionnaireService(mockDatabaseService as DatabaseService, mockLogger);
		});
	});
});
