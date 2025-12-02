import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createSaveController } from './save.ts';
import { createControllerTestSetup, TEST_DATA } from '../test-utils.ts';
import type { PortalService } from '#service';

describe('SaveController', () => {
	let testSetup: ReturnType<typeof createControllerTestSetup>;

	beforeEach(() => {
		testSetup = createControllerTestSetup();

		// Setup response locals for save controller
		testSetup.response.locals = {
			journeyResponse: {
				answers: TEST_DATA.answers
			},
			journey: {
				isComplete: mock.fn(() => true)
			}
		};
	});

	describe('successful submission', () => {
		it('should process complete submission workflow', async () => {
			(testSetup.service.saveSubmission as any).mock.mockImplementationOnce(() =>
				Promise.resolve(TEST_DATA.submission)
			);
			(testSetup.service.sendNotification as any).mock.mockImplementationOnce(() => Promise.resolve());

			const controller = createSaveController(testSetup.service, testSetup.portalService as unknown as PortalService);
			await controller(testSetup.request, testSetup.response);

			// Verify service calls
			assert.strictEqual((testSetup.service.saveSubmission as any).mock.callCount(), 1);
			assert.strictEqual((testSetup.service.sendNotification as any).mock.callCount(), 1);

			// Verify redirect to success page
			assert.strictEqual((testSetup.response.redirect as any).mock.callCount(), 1);
			assert.strictEqual((testSetup.response.redirect as any).mock.calls[0].arguments[0], '/questionnaire/success');

			// Verify logging
			assert.strictEqual((testSetup.portalService.logger.info as any).mock.callCount(), 2);
		});
	});

	describe('validation errors', () => {
		it('should redirect when journey is not complete', async () => {
			(testSetup.response.locals.journey.isComplete as any).mock.mockImplementation(() => false);

			const controller = createSaveController(testSetup.service, testSetup.portalService as unknown as PortalService);
			await controller(testSetup.request, testSetup.response);

			assert.strictEqual((testSetup.response.redirect as any).mock.callCount(), 1);
			assert.strictEqual(
				(testSetup.response.redirect as any).mock.calls[0].arguments[0],
				'/questionnaire/check-your-answers'
			);
			assert.strictEqual((testSetup.portalService.logger.warn as any).mock.callCount(), 1);
		});

		it('should redirect when no answers provided', async () => {
			testSetup.response.locals.journeyResponse.answers = null;

			const controller = createSaveController(testSetup.service, testSetup.portalService as unknown as PortalService);
			await controller(testSetup.request, testSetup.response);

			assert.strictEqual((testSetup.response.redirect as any).mock.callCount(), 1);
			assert.strictEqual((testSetup.response.redirect as any).mock.calls[0].arguments[0], '/questionnaire');
			assert.strictEqual((testSetup.portalService.logger.warn as any).mock.callCount(), 1);
		});

		it('should redirect when answers are empty', async () => {
			testSetup.response.locals.journeyResponse.answers = {};

			const controller = createSaveController(testSetup.service, testSetup.portalService as unknown as PortalService);
			await controller(testSetup.request, testSetup.response);

			assert.strictEqual((testSetup.response.redirect as any).mock.callCount(), 1);
			assert.strictEqual((testSetup.response.redirect as any).mock.calls[0].arguments[0], '/questionnaire');
		});
	});

	describe('error handling', () => {
		it('should handle service errors gracefully', async () => {
			const serviceError = new Error('Database connection failed');
			(testSetup.service.saveSubmission as any).mock.mockImplementationOnce(() => Promise.reject(serviceError));

			const controller = createSaveController(testSetup.service, testSetup.portalService as unknown as PortalService);
			await controller(testSetup.request, testSetup.response);

			// Should redirect to check answers page
			assert.strictEqual((testSetup.response.redirect as any).mock.callCount(), 1);
			assert.strictEqual(
				(testSetup.response.redirect as any).mock.calls[0].arguments[0],
				'/questionnaire/check-your-answers'
			);

			// Should log error
			assert.strictEqual((testSetup.portalService.logger.error as any).mock.callCount(), 1);
			assert.ok(
				(testSetup.portalService.logger.error as any).mock.calls[0].arguments[0].includes('Database connection failed')
			);
		});

		it('should handle non-Error exceptions', async () => {
			(testSetup.service.saveSubmission as any).mock.mockImplementationOnce(() => Promise.reject('String error'));

			const controller = createSaveController(testSetup.service, testSetup.portalService as unknown as PortalService);
			await controller(testSetup.request, testSetup.response);

			assert.strictEqual((testSetup.response.redirect as any).mock.callCount(), 1);
			assert.strictEqual((testSetup.portalService.logger.error as any).mock.callCount(), 1);
			assert.ok((testSetup.portalService.logger.error as any).mock.calls[0].arguments[0].includes('String error'));
		});
	});

	describe('session management', () => {
		it('should store submission in session', async () => {
			(testSetup.service.saveSubmission as any).mock.mockImplementationOnce(() =>
				Promise.resolve(TEST_DATA.submission)
			);
			(testSetup.service.sendNotification as any).mock.mockImplementationOnce(() => Promise.resolve());

			const controller = createSaveController(testSetup.service, testSetup.portalService as unknown as PortalService);
			await controller(testSetup.request, testSetup.response);

			// Verify session was updated
			assert.strictEqual(testSetup.request.session.questionnaires.lastReference, 'test-ref-123');
			assert.strictEqual(testSetup.request.session.questionnaires.submitted, true);
		});

		it('should set error in session on failure', async () => {
			(testSetup.service.saveSubmission as any).mock.mockImplementationOnce(() =>
				Promise.reject(new Error('Test error'))
			);

			const controller = createSaveController(testSetup.service, testSetup.portalService as unknown as PortalService);
			await controller(testSetup.request, testSetup.response);

			assert.strictEqual(
				testSetup.request.session.questionnaires.error,
				'There was a problem submitting your questionnaire. Please try again.'
			);
		});
	});
});
