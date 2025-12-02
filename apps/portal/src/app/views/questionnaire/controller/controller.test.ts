import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import type { PortalService } from '#service';
import { createQuestionnaireControllers } from './controller.ts';
import { createControllerTestSetup } from '../test-utils.ts';

describe('QuestionnaireControllers', () => {
	let testSetup: ReturnType<typeof createControllerTestSetup>;

	beforeEach(() => {
		testSetup = createControllerTestSetup();
	});

	describe('startJourney', () => {
		it('should render start page', () => {
			const controllers = createQuestionnaireControllers(testSetup.portalService as unknown as PortalService);
			controllers.startJourney(testSetup.request, testSetup.response);

			assert.strictEqual((testSetup.response.render as any).mock.callCount(), 1);
			assert.strictEqual(
				(testSetup.response.render as any).mock.calls[0].arguments[0],
				'views/questionnaire/templates/form-start.njk'
			);
			assert.deepStrictEqual((testSetup.response.render as any).mock.calls[0].arguments[1], {
				pageTitle: 'Local Plans Questionnaire'
			});
			assert.strictEqual((testSetup.portalService.logger.info as any).mock.callCount(), 1);
		});
	});

	describe('viewSuccessPage', () => {
		it('should render success page with valid session', () => {
			testSetup.request.session.questionnaires = {
				lastReference: 'test-ref-123',
				submitted: true
			};

			const controllers = createQuestionnaireControllers(testSetup.portalService as unknown as PortalService);
			controllers.viewSuccessPage(testSetup.request, testSetup.response);

			assert.strictEqual((testSetup.response.render as any).mock.callCount(), 1);
			assert.strictEqual(
				(testSetup.response.render as any).mock.calls[0].arguments[0],
				'views/questionnaire/templates/form-success.njk'
			);
			assert.deepStrictEqual((testSetup.response.render as any).mock.calls[0].arguments[1], {
				pageTitle: 'Questionnaire submitted successfully',
				reference: 'test-ref-123'
			});
		});

		it('should redirect to start when no submission data', () => {
			const controllers = createQuestionnaireControllers(testSetup.portalService as unknown as PortalService);
			controllers.viewSuccessPage(testSetup.request, testSetup.response);

			assert.strictEqual((testSetup.response.redirect as any).mock.callCount(), 1);
			assert.strictEqual((testSetup.response.redirect as any).mock.calls[0].arguments[0], '/questionnaire');
			assert.strictEqual((testSetup.portalService.logger.warn as any).mock.callCount(), 1);
		});

		it('should redirect to start when not submitted', () => {
			testSetup.request.session.questionnaires = {
				lastReference: 'test-ref-123',
				submitted: false
			};

			const controllers = createQuestionnaireControllers(testSetup.portalService as unknown as PortalService);
			controllers.viewSuccessPage(testSetup.request, testSetup.response);

			assert.strictEqual((testSetup.response.redirect as any).mock.callCount(), 1);
			assert.strictEqual((testSetup.response.redirect as any).mock.calls[0].arguments[0], '/questionnaire');
		});

		it('should handle session error by clearing and redirecting', () => {
			testSetup.request.session.questionnaires = {
				error: 'Test session error'
			};

			const controllers = createQuestionnaireControllers(testSetup.portalService as unknown as PortalService);
			controllers.viewSuccessPage(testSetup.request, testSetup.response);

			assert.strictEqual((testSetup.response.redirect as any).mock.callCount(), 1);
			assert.strictEqual(
				(testSetup.response.redirect as any).mock.calls[0].arguments[0],
				'/questionnaire/check-your-answers'
			);
			assert.strictEqual((testSetup.portalService.logger.warn as any).mock.callCount(), 1);

			// Session should be cleared
			assert.strictEqual(testSetup.request.session.questionnaires.lastReference, undefined);
			assert.strictEqual(testSetup.request.session.questionnaires.submitted, undefined);
			assert.strictEqual(testSetup.request.session.questionnaires.error, undefined);
		});
	});

	describe('service integration', () => {
		it('should create controllers that can handle requests', () => {
			const controllers = createQuestionnaireControllers(testSetup.portalService as unknown as PortalService);

			// Test controllers actually work
			controllers.startJourney(testSetup.request, testSetup.response);
			assert.strictEqual((testSetup.response.render as any).mock.callCount(), 1);

			// Test service methods exist and are callable
			assert.strictEqual(typeof controllers.questionnaireService.saveSubmission, 'function');
			assert.strictEqual(typeof controllers.questionnaireService.sendNotification, 'function');
			assert.strictEqual(typeof controllers.questionnaireService.getTotalSubmissions, 'function');
		});
	});
});
