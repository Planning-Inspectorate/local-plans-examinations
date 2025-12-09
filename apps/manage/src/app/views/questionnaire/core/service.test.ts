import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import type { Logger } from 'pino';
import { createQuestionnaireService } from './service.ts';
import { createMockLogger, TEST_DATA } from '../test-utils.ts';

describe('QuestionnaireService', () => {
	let mockLogger: Logger;
	let mockDataService: any;

	beforeEach(() => {
		mockLogger = createMockLogger() as unknown as Logger;
		mockDataService = {
			getTotalSubmissions: mock.fn(),
			getAllSubmissions: mock.fn(),
			getSubmissionById: mock.fn(),
			deleteSubmission: mock.fn()
		};
	});

	afterEach(() => {
		(mockLogger.info as any).mock.resetCalls();
		(mockLogger.warn as any).mock.resetCalls();
		(mockLogger.error as any).mock.resetCalls();
		(mockLogger.debug as any).mock.resetCalls();
		mockDataService.getTotalSubmissions.mock.resetCalls();
		mockDataService.getAllSubmissions.mock.resetCalls();
		mockDataService.getSubmissionById.mock.resetCalls();
		mockDataService.deleteSubmission.mock.resetCalls();
	});

	describe('getTotalSubmissions', () => {
		it('should return total count and log the operation', async () => {
			const expectedCount = 42;
			mockDataService.getTotalSubmissions.mock.mockImplementation(() => Promise.resolve(expectedCount));

			const service = createQuestionnaireService(mockLogger, mockDataService);
			const result = await service.getTotalSubmissions();

			assert.strictEqual(result, expectedCount);
			assert.strictEqual(mockDataService.getTotalSubmissions.mock.callCount(), 1);
			assert.ok((mockLogger.info as any).mock.callCount() >= 1);
		});

		it('should propagate data service errors', async () => {
			const error = new Error('Data service error');
			mockDataService.getTotalSubmissions.mock.mockImplementation(() => Promise.reject(error));

			const service = createQuestionnaireService(mockLogger, mockDataService);

			await assert.rejects(() => service.getTotalSubmissions(), error);
		});
	});

	describe('getAllSubmissions', () => {
		it('should return all submissions and log the count', async () => {
			mockDataService.getAllSubmissions.mock.mockImplementation(() => Promise.resolve(TEST_DATA.submissions));

			const service = createQuestionnaireService(mockLogger, mockDataService);
			const result = await service.getAllSubmissions();

			assert.deepStrictEqual(result, TEST_DATA.submissions);
			assert.strictEqual(mockDataService.getAllSubmissions.mock.callCount(), 1);
			assert.ok((mockLogger.info as any).mock.callCount() >= 1);
		});

		it('should handle empty results', async () => {
			mockDataService.getAllSubmissions.mock.mockImplementation(() => Promise.resolve([]));

			const service = createQuestionnaireService(mockLogger, mockDataService);
			const result = await service.getAllSubmissions();

			assert.deepStrictEqual(result, []);
		});
	});

	describe('getSubmissionById', () => {
		it('should return submission when valid ID provided', async () => {
			mockDataService.getSubmissionById.mock.mockImplementation(() => Promise.resolve(TEST_DATA.submission));

			const service = createQuestionnaireService(mockLogger, mockDataService);
			const result = await service.getSubmissionById('test-submission-123');

			assert.deepStrictEqual(result, TEST_DATA.submission);
			assert.strictEqual(mockDataService.getSubmissionById.mock.callCount(), 1);
			assert.ok((mockLogger.info as any).mock.callCount() >= 1);
		});

		it('should return null for invalid ID and log warning', async () => {
			const service = createQuestionnaireService(mockLogger, mockDataService);
			const result = await service.getSubmissionById('');

			assert.strictEqual(result, null);
			assert.strictEqual(mockDataService.getSubmissionById.mock.callCount(), 0);
			assert.ok((mockLogger.warn as any).mock.callCount() >= 1);
		});

		it('should return null for non-string ID', async () => {
			const service = createQuestionnaireService(mockLogger, mockDataService);
			const result = await service.getSubmissionById(123 as any);

			assert.strictEqual(result, null);
			assert.ok((mockLogger.warn as any).mock.callCount() >= 1);
		});

		it('should return null when submission not found', async () => {
			mockDataService.getSubmissionById.mock.mockImplementation(() => Promise.resolve(null));

			const service = createQuestionnaireService(mockLogger, mockDataService);
			const result = await service.getSubmissionById('non-existent');

			assert.strictEqual(result, null);
		});
	});

	describe('deleteSubmission', () => {
		it('should delete submission when valid ID and submission exists', async () => {
			mockDataService.getSubmissionById.mock.mockImplementation(() => Promise.resolve(TEST_DATA.submission));
			mockDataService.deleteSubmission.mock.mockImplementation(() => Promise.resolve());

			const service = createQuestionnaireService(mockLogger, mockDataService);
			await service.deleteSubmission('test-submission-123');

			assert.strictEqual(mockDataService.getSubmissionById.mock.callCount(), 1);
			assert.strictEqual(mockDataService.deleteSubmission.mock.callCount(), 1);
			assert.ok((mockLogger.info as any).mock.callCount() >= 1);
		});

		it('should throw error for invalid ID', async () => {
			const service = createQuestionnaireService(mockLogger, mockDataService);

			await assert.rejects(() => service.deleteSubmission(''), /Invalid submission ID provided for deletion/);
			assert.strictEqual(mockDataService.getSubmissionById.mock.callCount(), 0);
		});

		it('should throw error when submission not found', async () => {
			mockDataService.getSubmissionById.mock.mockImplementation(() => Promise.resolve(null));

			const service = createQuestionnaireService(mockLogger, mockDataService);

			await assert.rejects(
				() => service.deleteSubmission('non-existent'),
				/Questionnaire submission not found: non-existent/
			);
			assert.strictEqual(mockDataService.deleteSubmission.mock.callCount(), 0);
		});

		it('should propagate data service deletion errors', async () => {
			mockDataService.getSubmissionById.mock.mockImplementation(() => Promise.resolve(TEST_DATA.submission));
			mockDataService.deleteSubmission.mock.mockImplementation(() => Promise.reject(new Error('Deletion failed')));

			const service = createQuestionnaireService(mockLogger, mockDataService);

			await assert.rejects(() => service.deleteSubmission('test-submission-123'), /Deletion failed/);
		});
	});
});
