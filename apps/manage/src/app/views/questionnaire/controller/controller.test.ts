import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { createQuestionnaireControllers } from './controller.ts';
import { createControllerTestSetup, TEST_DATA, resetAllTestMocks } from '../test-utils.ts';

describe('Questionnaire Controllers', () => {
	let testSetup: ReturnType<typeof createControllerTestSetup>;

	beforeEach(() => {
		testSetup = createControllerTestSetup();
	});

	afterEach(() => {
		resetAllTestMocks(testSetup);
	});

	describe('listController', () => {
		it('should render questionnaire list with submissions', async () => {
			// Mock database operations
			(testSetup.manageService.db.questionnaire.count as any).mock.mockImplementation(() => Promise.resolve(2));
			(testSetup.manageService.db.questionnaire.findMany as any).mock.mockImplementation(() =>
				Promise.resolve(TEST_DATA.submissions)
			);

			const controllers = createQuestionnaireControllers(testSetup.manageService);
			await controllers.listController(testSetup.request, testSetup.response);

			assert.strictEqual((testSetup.response.render as any).mock.callCount(), 1);
			assert.strictEqual(
				(testSetup.response.render as any).mock.calls[0].arguments[0],
				'views/questionnaire/templates/view.njk'
			);

			const renderData = (testSetup.response.render as any).mock.calls[0].arguments[1];
			assert.strictEqual(renderData.pageHeading, 'Questionnaire Submissions');
			assert.strictEqual(renderData.totalCount, 2);
			assert.deepStrictEqual(renderData.submissions, TEST_DATA.submissions);
		});

		it('should handle empty submissions list', async () => {
			(testSetup.manageService.db.questionnaire.count as any).mock.mockImplementation(() => Promise.resolve(0));
			(testSetup.manageService.db.questionnaire.findMany as any).mock.mockImplementation(() => Promise.resolve([]));

			const controllers = createQuestionnaireControllers(testSetup.manageService);
			await controllers.listController(testSetup.request, testSetup.response);

			const renderData = (testSetup.response.render as any).mock.calls[0].arguments[1];
			assert.strictEqual(renderData.totalCount, 0);
			assert.deepStrictEqual(renderData.submissions, []);
		});

		it('should handle database errors', async () => {
			(testSetup.manageService.db.questionnaire.count as any).mock.mockImplementation(() =>
				Promise.reject(new Error('Database error'))
			);

			const controllers = createQuestionnaireControllers(testSetup.manageService);

			await assert.rejects(() => controllers.listController(testSetup.request, testSetup.response), /Database error/);
		});
	});

	describe('detailController', () => {
		it('should render questionnaire detail for valid ID', async () => {
			testSetup.request.params = { id: 'test-submission-123' };
			(testSetup.manageService.db.questionnaire.findUnique as any).mock.mockImplementation(() =>
				Promise.resolve(TEST_DATA.submission)
			);

			const controllers = createQuestionnaireControllers(testSetup.manageService);
			await controllers.detailController(testSetup.request, testSetup.response);

			assert.strictEqual((testSetup.response.render as any).mock.callCount(), 1);
			assert.strictEqual(
				(testSetup.response.render as any).mock.calls[0].arguments[0],
				'views/questionnaire/templates/detail.njk'
			);

			const renderData = (testSetup.response.render as any).mock.calls[0].arguments[1];
			assert.strictEqual(renderData.pageHeading, 'Questionnaire Submission');
			assert.deepStrictEqual(renderData.submission, TEST_DATA.submission);
		});

		it('should return 404 for non-existent submission', async () => {
			testSetup.request.params = { id: 'non-existent' };
			(testSetup.manageService.db.questionnaire.findUnique as any).mock.mockImplementation(() => Promise.resolve(null));

			const controllers = createQuestionnaireControllers(testSetup.manageService);
			await controllers.detailController(testSetup.request, testSetup.response);

			assert.strictEqual((testSetup.response.status as any).mock.callCount(), 1);
			assert.strictEqual((testSetup.response.status as any).mock.calls[0].arguments[0], 404);
			assert.strictEqual((testSetup.response.render as any).mock.callCount(), 1);
			assert.strictEqual((testSetup.response.render as any).mock.calls[0].arguments[0], 'views/errors/404.njk');
		});

		it('should handle database errors', async () => {
			testSetup.request.params = { id: 'test-submission-123' };
			(testSetup.manageService.db.questionnaire.findUnique as any).mock.mockImplementation(() =>
				Promise.reject(new Error('Database connection failed'))
			);

			const controllers = createQuestionnaireControllers(testSetup.manageService);

			await assert.rejects(
				() => controllers.detailController(testSetup.request, testSetup.response),
				/Database connection failed/
			);
		});
	});

	describe('Session Messages', () => {
		it('should display success message from session and clear it', async () => {
			testSetup.request.session = { successMessage: 'Submission deleted successfully' };
			(testSetup.manageService.db.questionnaire.count as any).mock.mockImplementation(() => Promise.resolve(1));
			(testSetup.manageService.db.questionnaire.findMany as any).mock.mockImplementation(() =>
				Promise.resolve([TEST_DATA.submission])
			);

			const controllers = createQuestionnaireControllers(testSetup.manageService);
			await controllers.listController(testSetup.request, testSetup.response);

			const renderData = (testSetup.response.render as any).mock.calls[0].arguments[1];
			assert.strictEqual(renderData.successMessage, 'Submission deleted successfully');
			assert.strictEqual(testSetup.request.session.successMessage, undefined);
		});

		it('should display error message from session and clear it', async () => {
			testSetup.request.session = { errorMessage: 'Failed to delete submission' };
			(testSetup.manageService.db.questionnaire.count as any).mock.mockImplementation(() => Promise.resolve(1));
			(testSetup.manageService.db.questionnaire.findMany as any).mock.mockImplementation(() =>
				Promise.resolve([TEST_DATA.submission])
			);

			const controllers = createQuestionnaireControllers(testSetup.manageService);
			await controllers.listController(testSetup.request, testSetup.response);

			const renderData = (testSetup.response.render as any).mock.calls[0].arguments[1];
			assert.strictEqual(renderData.errorMessage, 'Failed to delete submission');
			assert.strictEqual(testSetup.request.session.errorMessage, undefined);
		});

		it('should not display messages when session is empty', async () => {
			testSetup.request.session = {};
			(testSetup.manageService.db.questionnaire.count as any).mock.mockImplementation(() => Promise.resolve(1));
			(testSetup.manageService.db.questionnaire.findMany as any).mock.mockImplementation(() =>
				Promise.resolve([TEST_DATA.submission])
			);

			const controllers = createQuestionnaireControllers(testSetup.manageService);
			await controllers.listController(testSetup.request, testSetup.response);

			const renderData = (testSetup.response.render as any).mock.calls[0].arguments[1];
			assert.strictEqual(renderData.successMessage, undefined);
			assert.strictEqual(renderData.errorMessage, undefined);
		});
	});
});
