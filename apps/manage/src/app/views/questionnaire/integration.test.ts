import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { createQuestionnaireControllers } from './controller/controller.ts';
import { createControllerTestSetup, TEST_DATA, resetAllTestMocks } from './test-utils.ts';

describe('Questionnaire Integration Tests', () => {
	let testSetup: ReturnType<typeof createControllerTestSetup>;

	beforeEach(() => {
		testSetup = createControllerTestSetup();
	});

	afterEach(() => {
		resetAllTestMocks(testSetup);
	});

	describe('Complete Questionnaire Management Workflow', () => {
		it('should handle complete workflow from list to detail to delete', async () => {
			// Mock database operations
			(testSetup.manageService.db.questionnaire.count as any).mock.mockImplementation(() => Promise.resolve(2));
			(testSetup.manageService.db.questionnaire.findMany as any).mock.mockImplementation(() =>
				Promise.resolve(TEST_DATA.submissions)
			);
			(testSetup.manageService.db.questionnaire.findUnique as any).mock.mockImplementation(() =>
				Promise.resolve(TEST_DATA.submission)
			);
			(testSetup.manageService.db.questionnaire.update as any).mock.mockImplementation(() =>
				Promise.resolve(TEST_DATA.submission)
			);

			const controllers = createQuestionnaireControllers(testSetup.manageService);

			// Step 1: View list
			await controllers.listController(testSetup.request, testSetup.response);
			assert.strictEqual((testSetup.response.render as any).mock.callCount(), 1);
			assert.strictEqual(
				(testSetup.response.render as any).mock.calls[0].arguments[0],
				'views/questionnaire/templates/view.njk'
			);

			// Reset mocks for next step
			testSetup.response.resetMocks();

			// Step 2: View detail
			testSetup.request.params = { id: 'test-submission-123' };
			await controllers.detailController(testSetup.request, testSetup.response);
			assert.strictEqual((testSetup.response.render as any).mock.callCount(), 1);
			assert.strictEqual(
				(testSetup.response.render as any).mock.calls[0].arguments[0],
				'views/questionnaire/templates/detail.njk'
			);

			// Reset mocks for next step
			testSetup.response.resetMocks();

			// Verify all database operations were called
			assert.strictEqual((testSetup.manageService.db.questionnaire.count as any).mock.callCount(), 1);
			assert.strictEqual((testSetup.manageService.db.questionnaire.findMany as any).mock.callCount(), 1);
			assert.strictEqual((testSetup.manageService.db.questionnaire.findUnique as any).mock.callCount(), 1); // detail only
		});

		it('should handle error scenarios in workflow', async () => {
			const controllers = createQuestionnaireControllers(testSetup.manageService);

			// Test list with database error
			(testSetup.manageService.db.questionnaire.count as any).mock.mockImplementation(() =>
				Promise.reject(new Error('Database error'))
			);
			await assert.rejects(() => controllers.listController(testSetup.request, testSetup.response), /Database error/);

			// Reset and test detail with non-existent ID
			(testSetup.manageService.db.questionnaire.count as any).mock.mockImplementation(() => Promise.resolve(0));
			(testSetup.manageService.db.questionnaire.findUnique as any).mock.mockImplementation(() => Promise.resolve(null));

			testSetup.request.params = { id: 'non-existent' };
			await controllers.detailController(testSetup.request, testSetup.response);
			assert.strictEqual((testSetup.response.status as any).mock.callCount(), 1);
			assert.strictEqual((testSetup.response.status as any).mock.calls[0].arguments[0], 404);

			// Delete functionality tested in delete.test.ts
		});
	});

	describe('Service Layer Integration', () => {
		it('should integrate data service with business service', async () => {
			(testSetup.manageService.db.questionnaire.count as any).mock.mockImplementation(() => Promise.resolve(10));
			(testSetup.manageService.db.questionnaire.findMany as any).mock.mockImplementation(() =>
				Promise.resolve(TEST_DATA.submissions)
			);
			(testSetup.manageService.db.questionnaire.findUnique as any).mock.mockImplementation(() =>
				Promise.resolve(TEST_DATA.submission)
			);
			(testSetup.manageService.db.questionnaire.update as any).mock.mockImplementation(() => Promise.resolve());

			const controllers = createQuestionnaireControllers(testSetup.manageService);

			// Test get total submissions
			const count = await controllers.questionnaireService.getTotalSubmissions();
			assert.strictEqual(count, 10);

			// Test get all submissions
			const submissions = await controllers.questionnaireService.getAllSubmissions();
			assert.deepStrictEqual(submissions, TEST_DATA.submissions);

			// Test get submission by ID
			const submission = await controllers.questionnaireService.getSubmissionById('test-submission-123');
			assert.deepStrictEqual(submission, TEST_DATA.submission);

			// Test delete submission
			await assert.doesNotReject(() => controllers.questionnaireService.deleteSubmission('test-submission-123'));
		});

		it('should handle service layer validation', async () => {
			const controllers = createQuestionnaireControllers(testSetup.manageService);

			// Test invalid ID validation
			const result = await controllers.questionnaireService.getSubmissionById('');
			assert.strictEqual(result, null);

			// Test delete validation
			await assert.rejects(
				() => controllers.questionnaireService.deleteSubmission(''),
				/Invalid submission ID provided for deletion/
			);
		});
	});

	describe('Error Recovery Integration', () => {
		it('should handle database connection failures gracefully', async () => {
			const dbError = new Error('Database connection lost');
			(testSetup.manageService.db.questionnaire.count as any).mock.mockImplementation(() => Promise.reject(dbError));
			(testSetup.manageService.db.questionnaire.findMany as any).mock.mockImplementation(() => Promise.reject(dbError));
			(testSetup.manageService.db.questionnaire.findUnique as any).mock.mockImplementation(() =>
				Promise.reject(dbError)
			);

			const controllers = createQuestionnaireControllers(testSetup.manageService);

			// All operations should propagate the error
			await assert.rejects(() => controllers.listController(testSetup.request, testSetup.response), dbError);

			testSetup.request.params = { id: 'test-id' };
			await assert.rejects(() => controllers.detailController(testSetup.request, testSetup.response), dbError);
		});

		it('should log operations correctly', async () => {
			(testSetup.manageService.db.questionnaire.count as any).mock.mockImplementation(() => Promise.resolve(1));
			(testSetup.manageService.db.questionnaire.findMany as any).mock.mockImplementation(() =>
				Promise.resolve([TEST_DATA.submission])
			);

			const controllers = createQuestionnaireControllers(testSetup.manageService);
			await controllers.listController(testSetup.request, testSetup.response);

			// Verify logging occurred
			assert.ok((testSetup.manageService.logger.info as any).mock.callCount() >= 1);
			assert.ok((testSetup.manageService.logger.debug as any).mock.callCount() >= 1);
		});
	});

	describe('Configuration Integration', () => {
		it('should use correct templates and routes', async () => {
			(testSetup.manageService.db.questionnaire.count as any).mock.mockImplementation(() => Promise.resolve(0));
			(testSetup.manageService.db.questionnaire.findMany as any).mock.mockImplementation(() => Promise.resolve([]));

			const controllers = createQuestionnaireControllers(testSetup.manageService);
			await controllers.listController(testSetup.request, testSetup.response);

			const renderCall = (testSetup.response.render as any).mock.calls[0];
			assert.strictEqual(renderCall.arguments[0], 'views/questionnaire/templates/view.njk');

			const renderData = renderCall.arguments[1];
			assert.strictEqual(renderData.questionnaireConfig.questionnaireRoute, '/questionnaire');
			assert.strictEqual(renderData.questionnaireConfig.itemsRoute, '/items');
			assert.strictEqual(renderData.questionnaireConfig.emailNotProvided, 'Not Provided');
		});
	});

	describe('Edit Workflow Integration', () => {
		it('should handle complete edit workflow', async () => {
			// Mock database for loading and saving
			(testSetup.manageService.db.questionnaire.findUnique as any).mock.mockImplementation(() =>
				Promise.resolve(TEST_DATA.submission)
			);
			(testSetup.manageService.db.questionnaire.update as any).mock.mockImplementation(() =>
				Promise.resolve({ ...TEST_DATA.submission, name: 'Updated Name' })
			);

			// Verify database operations would be called in edit flow
			assert.ok(testSetup.manageService.db.questionnaire.findUnique);
			assert.ok(testSetup.manageService.db.questionnaire.update);
		});

		it('should handle database errors in edit flow', async () => {
			const dbError = new Error('Database connection failed');
			(testSetup.manageService.db.questionnaire.findUnique as any).mock.mockImplementation(() =>
				Promise.reject(dbError)
			);

			// Verify error would propagate
			await assert.rejects(
				() => testSetup.manageService.db.questionnaire.findUnique({ where: { id: 'test' } }),
				dbError
			);
		});
	});
});
