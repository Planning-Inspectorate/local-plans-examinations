import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { buildQuestionnaireList, buildQuestionnaireDetail } from '../controller.ts';
import { configureNunjucks } from '../../../nunjucks.ts';
import { mockLogger } from '@pins/local-plans-lib/testing/mock-logger.ts';

describe('questionnaire controllers', () => {
	const mockTable = {
		count: mock.fn(() => Promise.resolve(5)),
		findMany: mock.fn(() =>
			Promise.resolve([{ id: 'test-id', fullName: 'Test User', email: 'test@example.com', createdAt: new Date() }])
		),
		findUnique: mock.fn(() =>
			Promise.resolve({ id: 'test-id', fullName: 'Test User', email: 'test@example.com', createdAt: new Date() })
		)
	};
	const mockDb = {
		questionnaire: mockTable
	};

	describe('buildQuestionnaireList', () => {
		it('should render questionnaire list without error', async () => {
			const nunjucks = configureNunjucks();
			const mockRes = {
				render: mock.fn((view, data) => nunjucks.render(view, data))
			};

			const listController = buildQuestionnaireList({ db: mockDb, logger: mockLogger() });
			await assert.doesNotReject(() => listController({}, mockRes));

			assert.strictEqual(mockRes.render.mock.callCount(), 1);
			assert.strictEqual(mockRes.render.mock.calls[0].arguments[0], 'views/questionnaire/view.njk');
			assert.strictEqual(mockRes.render.mock.calls[0].arguments[1].pageHeading, 'Questionnaire Submissions');
		});
	});

	describe('buildQuestionnaireDetail', () => {
		it('should render questionnaire detail without error', async () => {
			const nunjucks = configureNunjucks();
			const mockRes = {
				render: mock.fn((view, data) => nunjucks.render(view, data))
			};
			const mockReq = {
				params: { id: 'test-id' }
			};

			const detailController = buildQuestionnaireDetail({ db: mockDb, logger: mockLogger() });
			await assert.doesNotReject(() => detailController(mockReq, mockRes));

			assert.strictEqual(mockRes.render.mock.callCount(), 1);
			assert.strictEqual(mockRes.render.mock.calls[0].arguments[0], 'views/questionnaire/detail.njk');
			assert.strictEqual(mockRes.render.mock.calls[0].arguments[1].pageHeading, 'Questionnaire Submission');
		});

		it('should return 404 for non-existent submission', async () => {
			mockTable.findUnique = mock.fn(() => Promise.resolve(null));
			const mockRes = {
				status: mock.fn(() => mockRes),
				render: mock.fn()
			};
			const mockReq = {
				params: { id: 'non-existent' }
			};

			const detailController = buildQuestionnaireDetail({ db: mockDb, logger: mockLogger() });
			await detailController(mockReq, mockRes);

			assert.strictEqual(mockRes.status.mock.callCount(), 1);
			assert.strictEqual(mockRes.status.mock.calls[0].arguments[0], 404);
		});
	});
});
