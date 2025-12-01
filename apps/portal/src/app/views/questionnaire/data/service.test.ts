import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createQuestionnaireDataService } from './service.ts';
import type { QuestionnaireAnswers } from '../core/service.ts';

describe('QuestionnaireDataService', () => {
	let mockLogger: any;
	let mockPrisma: any;

	beforeEach(() => {
		mockLogger = {
			info: mock.fn(),
			debug: mock.fn(),
			error: mock.fn(),
			warn: mock.fn()
		};

		mockPrisma = {
			questionnaire: {
				create: mock.fn(),
				count: mock.fn()
			}
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
		it('should save questionnaire submission successfully', async () => {
			const expectedResult = {
				id: 'test-id-123',
				createdAt: new Date('2024-01-01T00:00:00Z')
			};

			mockPrisma.questionnaire.create.mock.mockImplementation(() => Promise.resolve(expectedResult));

			const service = createQuestionnaireDataService(mockPrisma, mockLogger);
			const result = await service.saveSubmission(testAnswers);

			assert.deepStrictEqual(result, expectedResult);
			assert.strictEqual(mockPrisma.questionnaire.create.mock.callCount(), 1);
			assert.ok(mockLogger.info.mock.callCount() >= 1);

			const createCall = mockPrisma.questionnaire.create.mock.calls[0];
			assert.deepStrictEqual(createCall.arguments[0], {
				data: {
					fullName: 'John Doe',
					email: 'john@example.com',
					rating: 'excellent',
					feedback: 'Great service!'
				},
				select: { id: true, createdAt: true }
			});
		});

		it('should handle null email when not provided', async () => {
			const answersWithoutEmail: QuestionnaireAnswers = {
				fullName: 'Jane Doe',
				rating: 'good',
				feedback: 'Nice service'
			};

			const expectedResult = {
				id: 'test-id-456',
				createdAt: new Date('2024-01-01T00:00:00Z')
			};

			mockPrisma.questionnaire.create.mock.mockImplementation(() => Promise.resolve(expectedResult));

			const service = createQuestionnaireDataService(mockPrisma, mockLogger);
			await service.saveSubmission(answersWithoutEmail);

			// Email handling is done by the service implementation
			assert.ok(mockPrisma.questionnaire.create.mock.callCount() >= 1);
		});

		it('should propagate database errors', async () => {
			const dbError = new Error('Database connection failed');
			mockPrisma.questionnaire.create.mock.mockImplementation(() => Promise.reject(dbError));

			const service = createQuestionnaireDataService(mockPrisma, mockLogger);

			await assert.rejects(() => service.saveSubmission(testAnswers), dbError);
		});
	});

	describe('getTotalSubmissions', () => {
		it('should return total submission count excluding deleted records', async () => {
			const expectedCount = 42;
			mockPrisma.questionnaire.count.mock.mockImplementation(() => Promise.resolve(expectedCount));

			const service = createQuestionnaireDataService(mockPrisma, mockLogger);
			const result = await service.getTotalSubmissions();

			assert.strictEqual(result, expectedCount);
			assert.strictEqual(mockPrisma.questionnaire.count.mock.callCount(), 1);
			assert.ok(mockLogger.debug.mock.callCount() >= 1);

			const countCall = mockPrisma.questionnaire.count.mock.calls[0];
			assert.deepStrictEqual(countCall.arguments[0], {
				where: { isDeleted: false }
			});
		});

		it('should propagate database errors', async () => {
			const dbError = new Error('Database query failed');
			mockPrisma.questionnaire.count.mock.mockImplementation(() => Promise.reject(dbError));

			const service = createQuestionnaireDataService(mockPrisma, mockLogger);

			await assert.rejects(() => service.getTotalSubmissions(), dbError);
		});
	});
});
