import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { createQuestionnaireControllers } from '../controller.ts';
import { SessionManager } from '../core/service.ts';

describe('Questionnaire Controllers', () => {
	it('should handle start journey with logging', () => {
		const mockLogger = {
			info: mock.fn(),
			error: mock.fn(),
			debug: mock.fn(),
			warn: mock.fn()
		};

		const mockService = {
			logger: mockLogger,
			db: {}
		};

		let renderTemplate = '';
		let renderData: any = {};
		const mockReq = {};
		const mockRes = {
			render: (template: string, data: any) => {
				renderTemplate = template;
				renderData = data;
			}
		};

		const controllers = createQuestionnaireControllers(mockService as any);
		controllers.startJourney(mockReq as any, mockRes as any);

		assert.ok(renderTemplate.includes('form-start.njk'));
		assert.strictEqual(renderData.pageTitle, 'Local Plans Questionnaire');
		assert.strictEqual(mockLogger.info.mock.callCount(), 1);
		assert.strictEqual(mockLogger.info.mock.calls[0].arguments[0], 'Displaying questionnaire start page');
	});

	it('should handle success page with valid session', () => {
		const mockLogger = {
			info: mock.fn(),
			error: mock.fn(),
			debug: mock.fn(),
			warn: mock.fn()
		};

		const mockService = {
			logger: mockLogger,
			db: {}
		};

		const mockReq = {
			session: {
				questionnaires: {
					lastReference: 'test-ref-123',
					submitted: true
				}
			}
		};

		let renderTemplate = '';
		let renderData: any = {};
		const mockRes = {
			render: (template: string, data: any) => {
				renderTemplate = template;
				renderData = data;
			},
			redirect: mock.fn()
		};

		const controllers = createQuestionnaireControllers(mockService as any);
		controllers.viewSuccessPage(mockReq as any, mockRes as any);

		assert.ok(renderTemplate.includes('form-success.njk'));
		assert.strictEqual(renderData.pageTitle, 'Questionnaire submitted successfully');
		assert.strictEqual(renderData.reference, 'test-ref-123');
		assert.strictEqual(mockLogger.info.mock.callCount(), 2); // Session check + render
	});

	it('should redirect when no submission data in session', () => {
		const mockLogger = {
			info: mock.fn(),
			error: mock.fn(),
			debug: mock.fn(),
			warn: mock.fn()
		};

		const mockService = {
			logger: mockLogger,
			db: {}
		};

		const mockReq = {
			session: {}
		};

		const mockRes = {
			render: mock.fn(),
			redirect: mock.fn()
		};

		const controllers = createQuestionnaireControllers(mockService as any);
		controllers.viewSuccessPage(mockReq as any, mockRes as any);

		assert.strictEqual(mockRes.redirect.mock.callCount(), 1);
		assert.strictEqual(mockRes.redirect.mock.calls[0].arguments[0], '/questionnaire');
		assert.strictEqual(mockLogger.warn.mock.callCount(), 1);
		assert.ok(mockLogger.warn.mock.calls[0].arguments[0].includes('No submission data'));
	});

	it('should handle session error and redirect to check answers', () => {
		const mockLogger = {
			info: mock.fn(),
			error: mock.fn(),
			debug: mock.fn(),
			warn: mock.fn()
		};

		const mockService = {
			logger: mockLogger,
			db: {}
		};

		const mockReq = {
			session: {
				questionnaires: {
					error: 'Database connection failed'
				}
			}
		};

		const mockRes = {
			render: mock.fn(),
			redirect: mock.fn()
		};

		const controllers = createQuestionnaireControllers(mockService as any);
		controllers.viewSuccessPage(mockReq as any, mockRes as any);

		assert.strictEqual(mockRes.redirect.mock.callCount(), 1);
		assert.strictEqual(mockRes.redirect.mock.calls[0].arguments[0], '/questionnaire/check-your-answers');
		assert.strictEqual(mockLogger.warn.mock.callCount(), 1);
		assert.ok(mockLogger.warn.mock.calls[0].arguments[0].includes('Session error'));
	});

	it('should clear session after successful render', () => {
		const mockService = {
			logger: {
				info: mock.fn(),
				error: mock.fn(),
				debug: mock.fn(),
				warn: mock.fn()
			},
			db: {}
		};

		const mockReq = {
			session: {
				questionnaires: {
					lastReference: 'test-ref',
					submitted: true
				}
			}
		};

		const mockRes = {
			render: mock.fn(),
			redirect: mock.fn()
		};

		const controllers = createQuestionnaireControllers(mockService as any);
		controllers.viewSuccessPage(mockReq as any, mockRes as any);

		// Session should be cleared after successful render
		assert.strictEqual(mockReq.session.questionnaires.lastReference, undefined);
		assert.strictEqual(mockReq.session.questionnaires.submitted, undefined);
	});
});
