import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createQuestionnaireControllers } from './controller.ts';
import {
	createMockPortalService,
	createMockRequest,
	createMockResponse,
	SessionDataBuilder,
	AssertionHelpers
} from './test-helpers.ts';

/**
 * Questionnaire Controllers unit tests
 * Tests controller behavior in isolation
 */
describe('Questionnaire Controllers', () => {
	let mockService: ReturnType<typeof createMockPortalService>;
	let controllers: ReturnType<typeof createQuestionnaireControllers>;

	const setupControllers = (serviceOverrides = {}) => {
		mockService = createMockPortalService(serviceOverrides);
		controllers = createQuestionnaireControllers(mockService as any);
	};

	describe('startJourney()', () => {
		it('should render start page with correct template and data', () => {
			setupControllers();
			const mockReq = createMockRequest();
			const mockRes = createMockResponse();

			controllers.startJourney(mockReq as any, mockRes as any);

			AssertionHelpers.assertTemplateRendered(mockRes, 'form-start.njk', {
				pageTitle: 'Local Plans Questionnaire'
			});
			AssertionHelpers.assertMockCalled(mockService.logger.info, 1, ['Displaying questionnaire start page']);
		});
	});

	describe('viewSuccessPage()', () => {
		it('should render success page with valid session', () => {
			setupControllers();
			const sessionData = SessionDataBuilder.withSubmission('test-ref-123');
			const mockReq = createMockRequest(sessionData);
			const mockRes = createMockResponse();

			controllers.viewSuccessPage(mockReq as any, mockRes as any);

			AssertionHelpers.assertTemplateRendered(mockRes, 'form-success.njk', {
				pageTitle: 'Questionnaire submitted successfully',
				reference: 'test-ref-123'
			});
			AssertionHelpers.assertMockCalled(mockService.logger.info, 2); // Session check + render
		});

		it('should redirect when no submission data in session', () => {
			setupControllers();
			const mockReq = createMockRequest(SessionDataBuilder.empty());
			const mockRes = createMockResponse();

			controllers.viewSuccessPage(mockReq as any, mockRes as any);

			AssertionHelpers.assertRedirect(mockRes, '/questionnaire');
			AssertionHelpers.assertMockCalled(mockService.logger.warn, 1);
			assert.ok(mockService.logger.warn.mock.calls[0].arguments[0].includes('No submission data'));
		});

		it('should handle session error and redirect to check answers', () => {
			setupControllers();
			const sessionData = SessionDataBuilder.withError('Database connection failed');
			const mockReq = createMockRequest(sessionData);
			const mockRes = createMockResponse();

			controllers.viewSuccessPage(mockReq as any, mockRes as any);

			AssertionHelpers.assertRedirect(mockRes, '/questionnaire/check-your-answers');
			AssertionHelpers.assertMockCalled(mockService.logger.warn, 1);
			assert.ok(mockService.logger.warn.mock.calls[0].arguments[0].includes('Session error'));
		});

		it('should clear session after successful render', () => {
			setupControllers();
			const sessionData = SessionDataBuilder.withSubmission('test-ref');
			const mockReq = createMockRequest(sessionData);
			const mockRes = createMockResponse();

			controllers.viewSuccessPage(mockReq as any, mockRes as any);

			// Session should be cleared after successful render
			assert.strictEqual(mockReq.session.questionnaires.lastReference, undefined);
			assert.strictEqual(mockReq.session.questionnaires.submitted, undefined);
		});
	});

	describe('Factory Function', () => {
		it('should create controllers with proper dependencies', () => {
			setupControllers();

			assert.ok(typeof controllers.startJourney === 'function');
			assert.ok(typeof controllers.viewSuccessPage === 'function');
			assert.ok(controllers.questionnaireService);
		});
	});
});
