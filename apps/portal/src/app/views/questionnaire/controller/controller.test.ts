import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createQuestionnaireControllers } from './controller.ts';

describe('QuestionnaireControllers', () => {
	const mockDb = {
		questionnaire: {
			create: mock.fn(),
			count: mock.fn()
		}
	};

	const mockLogger = {
		info: mock.fn(),
		warn: mock.fn(),
		error: mock.fn(),
		debug: mock.fn()
	};

	const mockPortalService = {
		db: mockDb,
		logger: mockLogger
	};

	let mockRequest: any;
	let mockResponse: any;

	beforeEach(() => {
		mockRequest = {
			session: {}
		};

		mockResponse = {
			render: mock.fn(),
			redirect: mock.fn()
		};

		// Reset mocks
		mockLogger.info.mock.resetCalls();
		mockLogger.warn.mock.resetCalls();
		mockResponse.render.mock.resetCalls();
		mockResponse.redirect.mock.resetCalls();
	});

	describe('startJourney', () => {
		it('should render start page', () => {
			const controllers = createQuestionnaireControllers(mockPortalService as any);
			controllers.startJourney(mockRequest, mockResponse);

			assert.strictEqual(mockResponse.render.mock.callCount(), 1);
			assert.strictEqual(
				mockResponse.render.mock.calls[0].arguments[0],
				'views/questionnaire/templates/form-start.njk'
			);
			assert.deepStrictEqual(mockResponse.render.mock.calls[0].arguments[1], {
				pageTitle: 'Local Plans Questionnaire'
			});
			assert.strictEqual(mockLogger.info.mock.callCount(), 1);
		});
	});

	describe('viewSuccessPage', () => {
		it('should render success page with valid session', () => {
			mockRequest.session.questionnaires = {
				lastReference: 'test-ref-123',
				submitted: true
			};

			const controllers = createQuestionnaireControllers(mockPortalService as any);
			controllers.viewSuccessPage(mockRequest, mockResponse);

			assert.strictEqual(mockResponse.render.mock.callCount(), 1);
			assert.strictEqual(
				mockResponse.render.mock.calls[0].arguments[0],
				'views/questionnaire/templates/form-success.njk'
			);
			assert.deepStrictEqual(mockResponse.render.mock.calls[0].arguments[1], {
				pageTitle: 'Questionnaire submitted successfully',
				reference: 'test-ref-123'
			});
		});

		it('should redirect to start when no submission data', () => {
			const controllers = createQuestionnaireControllers(mockPortalService as any);
			controllers.viewSuccessPage(mockRequest, mockResponse);

			assert.strictEqual(mockResponse.redirect.mock.callCount(), 1);
			assert.strictEqual(mockResponse.redirect.mock.calls[0].arguments[0], '/questionnaire');
			assert.strictEqual(mockLogger.warn.mock.callCount(), 1);
		});

		it('should redirect to start when not submitted', () => {
			mockRequest.session.questionnaires = {
				lastReference: 'test-ref-123',
				submitted: false
			};

			const controllers = createQuestionnaireControllers(mockPortalService as any);
			controllers.viewSuccessPage(mockRequest, mockResponse);

			assert.strictEqual(mockResponse.redirect.mock.callCount(), 1);
			assert.strictEqual(mockResponse.redirect.mock.calls[0].arguments[0], '/questionnaire');
		});

		it('should handle session error by clearing and redirecting', () => {
			mockRequest.session.questionnaires = {
				error: 'Test session error'
			};

			const controllers = createQuestionnaireControllers(mockPortalService as any);
			controllers.viewSuccessPage(mockRequest, mockResponse);

			assert.strictEqual(mockResponse.redirect.mock.callCount(), 1);
			assert.strictEqual(mockResponse.redirect.mock.calls[0].arguments[0], '/questionnaire/check-your-answers');
			assert.strictEqual(mockLogger.warn.mock.callCount(), 1);

			// Session should be cleared
			assert.strictEqual(mockRequest.session.questionnaires.lastReference, undefined);
			assert.strictEqual(mockRequest.session.questionnaires.submitted, undefined);
			assert.strictEqual(mockRequest.session.questionnaires.error, undefined);
		});
	});

	describe('service integration', () => {
		it('should create controllers with proper service dependencies', () => {
			const controllers = createQuestionnaireControllers(mockPortalService as any);

			assert.ok(controllers.startJourney);
			assert.ok(controllers.viewSuccessPage);
			assert.ok(controllers.questionnaireService);
			assert.ok(controllers.questionnaireService.saveSubmission);
			assert.ok(controllers.questionnaireService.sendNotification);
			assert.ok(controllers.questionnaireService.getTotalSubmissions);
		});
	});
});
