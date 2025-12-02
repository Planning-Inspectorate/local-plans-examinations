import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import type { Logger } from 'pino';
import { createQuestionnaireDataService } from './service.ts';
import { createMockLogger, createMockDb, TEST_DATA } from '../test-utils.ts';

describe('QuestionnaireDataService', () => {
	let mockLogger: Logger;
	let mockPrisma: any;

	beforeEach(() => {
		mockLogger = createMockLogger() as unknown as Logger;
		mockPrisma = createMockDb();
	});

	afterEach(() => {
		(mockLogger.info as any).mock.resetCalls();
		(mockLogger.debug as any).mock.resetCalls();
		(mockLogger.error as any).mock.resetCalls();
		(mockLogger.warn as any).mock.resetCalls();
		(mockPrisma.questionnaire.create as any).mock.resetCalls();
		(mockPrisma.questionnaire.count as any).mock.resetCalls();
	});

	describe('saveSubmission', () => {
		it('should save questionnaire submission successfully', async () => {
			(mockPrisma.questionnaire.create as any).mock.mockImplementation(() => Promise.resolve(TEST_DATA.dbResult));

			const service = createQuestionnaireDataService(mockPrisma, mockLogger);
			const result = await service.saveSubmission(TEST_DATA.answers);

			assert.deepStrictEqual(result, TEST_DATA.dbResult);
			assert.strictEqual((mockPrisma.questionnaire.create as any).mock.callCount(), 1);
			assert.ok((mockLogger.info as any).mock.callCount() >= 1);

			const createCall = (mockPrisma.questionnaire.create as any).mock.calls[0];
			assert.deepStrictEqual((createCall as any).arguments[0], {
				data: {
					fullName: TEST_DATA.answers.fullName,
					email: TEST_DATA.answers.email,
					rating: TEST_DATA.answers.rating,
					feedback: TEST_DATA.answers.feedback
				},
				select: { id: true, createdAt: true }
			});
		});

		it('should handle null email when not provided', async () => {
			const answersWithoutEmail = {
				fullName: 'Jane Doe',
				rating: 'good',
				feedback: 'Nice service'
			};

			(mockPrisma.questionnaire.create as any).mock.mockImplementation(() => Promise.resolve(TEST_DATA.dbResult));

			const service = createQuestionnaireDataService(mockPrisma, mockLogger);
			await service.saveSubmission(answersWithoutEmail);

			// Verify email field is set to null when not provided
			const createCall = (mockPrisma.questionnaire.create as any).mock.calls[0];
			assert.strictEqual((createCall as any).arguments[0].data.email, null);
		});

		it('should propagate database errors', async () => {
			const dbError = new Error('Database connection failed');
			(mockPrisma.questionnaire.create as any).mock.mockImplementation(() => Promise.reject(dbError));

			const service = createQuestionnaireDataService(mockPrisma, mockLogger);

			await assert.rejects(() => service.saveSubmission(TEST_DATA.answers), dbError);
		});
	});

	describe('getTotalSubmissions', () => {
		it('should return total submission count excluding deleted records', async () => {
			const expectedCount = 42;
			(mockPrisma.questionnaire.count as any).mock.mockImplementation(() => Promise.resolve(expectedCount));

			const service = createQuestionnaireDataService(mockPrisma, mockLogger);
			const result = await service.getTotalSubmissions();

			assert.strictEqual(result, expectedCount);
			assert.strictEqual((mockPrisma.questionnaire.count as any).mock.callCount(), 1);
			assert.ok((mockLogger.debug as any).mock.callCount() >= 1);

			const countCall = (mockPrisma.questionnaire.count as any).mock.calls[0];
			assert.deepStrictEqual((countCall as any).arguments[0], {
				where: { isDeleted: false }
			});
		});

		it('should propagate database errors', async () => {
			const dbError = new Error('Database query failed');
			(mockPrisma.questionnaire.count as any).mock.mockImplementation(() => Promise.reject(dbError));

			const service = createQuestionnaireDataService(mockPrisma, mockLogger);

			await assert.rejects(() => service.getTotalSubmissions(), dbError);
		});
	});
});
