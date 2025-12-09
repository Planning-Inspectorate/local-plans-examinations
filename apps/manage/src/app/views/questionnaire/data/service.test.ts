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
		(mockPrisma.questionnaire.count as any).mock.resetCalls();
		(mockPrisma.questionnaire.findMany as any).mock.resetCalls();
		(mockPrisma.questionnaire.findUnique as any).mock.resetCalls();
		(mockPrisma.questionnaire.update as any).mock.resetCalls();
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

	describe('getAllSubmissions', () => {
		it('should return all submissions ordered by creation date', async () => {
			(mockPrisma.questionnaire.findMany as any).mock.mockImplementation(() => Promise.resolve(TEST_DATA.submissions));

			const service = createQuestionnaireDataService(mockPrisma, mockLogger);
			const result = await service.getAllSubmissions();

			assert.deepStrictEqual(result, TEST_DATA.submissions);
			assert.strictEqual((mockPrisma.questionnaire.findMany as any).mock.callCount(), 1);
			assert.ok((mockLogger.debug as any).mock.callCount() >= 1);

			const findCall = (mockPrisma.questionnaire.findMany as any).mock.calls[0];
			assert.deepStrictEqual((findCall as any).arguments[0], {
				where: { isDeleted: false },
				orderBy: { createdAt: 'desc' }
			});
		});

		it('should return empty array when no submissions exist', async () => {
			(mockPrisma.questionnaire.findMany as any).mock.mockImplementation(() => Promise.resolve([]));

			const service = createQuestionnaireDataService(mockPrisma, mockLogger);
			const result = await service.getAllSubmissions();

			assert.deepStrictEqual(result, []);
		});
	});

	describe('getSubmissionById', () => {
		it('should return submission when found', async () => {
			(mockPrisma.questionnaire.findUnique as any).mock.mockImplementation(() => Promise.resolve(TEST_DATA.submission));

			const service = createQuestionnaireDataService(mockPrisma, mockLogger);
			const result = await service.getSubmissionById('test-submission-123');

			assert.deepStrictEqual(result, TEST_DATA.submission);
			assert.strictEqual((mockPrisma.questionnaire.findUnique as any).mock.callCount(), 1);

			const findCall = (mockPrisma.questionnaire.findUnique as any).mock.calls[0];
			assert.deepStrictEqual((findCall as any).arguments[0], {
				where: { id: 'test-submission-123', isDeleted: false }
			});
		});

		it('should return null when submission not found', async () => {
			(mockPrisma.questionnaire.findUnique as any).mock.mockImplementation(() => Promise.resolve(null));

			const service = createQuestionnaireDataService(mockPrisma, mockLogger);
			const result = await service.getSubmissionById('non-existent');

			assert.strictEqual(result, null);
		});
	});

	describe('deleteSubmission', () => {
		it('should soft delete submission by setting isDeleted to true', async () => {
			(mockPrisma.questionnaire.update as any).mock.mockImplementation(() => Promise.resolve(TEST_DATA.submission));

			const service = createQuestionnaireDataService(mockPrisma, mockLogger);
			await service.deleteSubmission('test-submission-123');

			assert.strictEqual((mockPrisma.questionnaire.update as any).mock.callCount(), 1);
			assert.ok((mockLogger.info as any).mock.callCount() >= 1);

			const updateCall = (mockPrisma.questionnaire.update as any).mock.calls[0];
			assert.deepStrictEqual((updateCall as any).arguments[0], {
				where: { id: 'test-submission-123' },
				data: { isDeleted: true }
			});
		});

		it('should handle deletion errors', async () => {
			const error = new Error('Deletion failed');
			(mockPrisma.questionnaire.update as any).mock.mockImplementation(() => Promise.reject(error));

			const service = createQuestionnaireDataService(mockPrisma, mockLogger);

			await assert.rejects(() => service.deleteSubmission('test-submission-123'), error);
		});
	});
});
