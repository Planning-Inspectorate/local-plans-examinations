import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { createQuestionnaireControllers } from './controller/controller.ts';
import { createSaveController } from './controller/save.ts';
import { createJourney } from './core/journey.ts';
import { createQuestionnaireQuestions } from './core/questions.ts';
import { createControllerTestSetup, TEST_DATA, resetAllTestMocks } from './test-utils.ts';

describe('Questionnaire Integration Tests', () => {
	let testSetup: ReturnType<typeof createControllerTestSetup>;

	beforeEach(() => {
		testSetup = createControllerTestSetup();
	});

	afterEach(() => {
		resetAllTestMocks(testSetup);
	});

	describe('Complete Questionnaire Workflow', () => {
		it('should handle complete user journey from start to success', async () => {
			// Mock database operations
			(testSetup.portalService.db.questionnaire.create as any).mock.mockImplementation(() =>
				Promise.resolve(TEST_DATA.dbResult)
			);

			// Create controllers
			const controllers = createQuestionnaireControllers(testSetup.portalService);

			// Start journey
			controllers.startJourney(testSetup.request, testSetup.response);
			assert.strictEqual((testSetup.response.render as any).mock.callCount(), 1);
			assert.strictEqual(
				(testSetup.response.render as any).mock.calls[0].arguments[0],
				'views/questionnaire/templates/form-start.njk'
			);

			// Setup journey with answers
			const questions = createQuestionnaireQuestions();
			const journey = createJourney(questions, { answers: TEST_DATA.answers }, testSetup.request);

			testSetup.response.locals.journeyResponse = { answers: TEST_DATA.answers };
			testSetup.response.locals.journey = { isComplete: () => true };

			// Save submission
			const saveController = createSaveController(controllers.questionnaireService, testSetup.portalService);
			await saveController(testSetup.request, testSetup.response);

			// Verify save workflow
			assert.strictEqual((testSetup.portalService.db.questionnaire.create as any).mock.callCount(), 1);
			assert.strictEqual((testSetup.response.redirect as any).mock.callCount(), 1); // Save redirects to success

			// View success page
			(testSetup.response.render as any).mock.resetCalls();
			(testSetup.response.redirect as any).mock.resetCalls();

			controllers.viewSuccessPage(testSetup.request, testSetup.response);
			assert.strictEqual((testSetup.response.render as any).mock.callCount(), 1);
			assert.strictEqual(
				(testSetup.response.render as any).mock.calls[0].arguments[0],
				'views/questionnaire/templates/form-success.njk'
			);
		});

		it('should handle validation errors in workflow', async () => {
			const controllers = createQuestionnaireControllers(testSetup.portalService);

			// Setup incomplete journey
			testSetup.response.locals.journeyResponse = { answers: {} };
			testSetup.response.locals.journey = { isComplete: () => false };

			const saveController = createSaveController(controllers.questionnaireService, testSetup.portalService);
			await saveController(testSetup.request, testSetup.response);

			// Should redirect to check answers
			assert.strictEqual((testSetup.response.redirect as any).mock.callCount(), 1);
			assert.strictEqual(
				(testSetup.response.redirect as any).mock.calls[0].arguments[0],
				'/questionnaire/check-your-answers'
			);
		});

		it('should handle database errors in workflow', async () => {
			// Mock database error
			(testSetup.portalService.db.questionnaire.create as any).mock.mockImplementation(() =>
				Promise.reject(new Error('Database connection failed'))
			);

			const controllers = createQuestionnaireControllers(testSetup.portalService);

			// Setup valid journey
			testSetup.response.locals.journeyResponse = { answers: TEST_DATA.answers };
			testSetup.response.locals.journey = { isComplete: () => true };

			const saveController = createSaveController(controllers.questionnaireService, testSetup.portalService);
			await saveController(testSetup.request, testSetup.response);

			// Should handle error and redirect
			assert.strictEqual((testSetup.response.redirect as any).mock.callCount(), 1);
			assert.strictEqual(
				(testSetup.response.redirect as any).mock.calls[0].arguments[0],
				'/questionnaire/check-your-answers'
			);
			assert.ok(testSetup.request.session.questionnaires?.error);
		});
	});

	describe('Journey Configuration Integration', () => {
		it('should create journey with questions and sections', () => {
			const questions = createQuestionnaireQuestions();
			const journey = createJourney(questions, null, testSetup.request);

			assert.strictEqual(journey.journeyId, 'questionnaire');
			assert.strictEqual(journey.journeyTitle, 'Local Plans Questionnaire');
			assert.ok(journey.sections);
		});

		it('should validate journey URLs correctly', () => {
			const questions = createQuestionnaireQuestions();

			// Valid URLs
			const validUrls = ['/questionnaire', '/app/questionnaire', '/test/questionnaire'];
			validUrls.forEach((url) => {
				testSetup.request.baseUrl = url;
				assert.doesNotThrow(() => createJourney(questions, null, testSetup.request));
			});

			// Invalid URLs
			const invalidUrls = ['/questionnaire/extra', '/other', '/questionnaires'];
			invalidUrls.forEach((url) => {
				testSetup.request.baseUrl = url;
				assert.throws(() => createJourney(questions, null, testSetup.request));
			});
		});
	});

	describe('Service Layer Integration', () => {
		it('should integrate data service with business service', async () => {
			(testSetup.portalService.db.questionnaire.create as any).mock.mockImplementation(() =>
				Promise.resolve(TEST_DATA.dbResult)
			);
			(testSetup.portalService.db.questionnaire.count as any).mock.mockImplementation(() => Promise.resolve(10));

			const controllers = createQuestionnaireControllers(testSetup.portalService);

			// Test save submission
			const submission = await controllers.questionnaireService.saveSubmission(TEST_DATA.answers);
			assert.strictEqual(submission.id, TEST_DATA.dbResult.id);
			assert.strictEqual(submission.reference, TEST_DATA.dbResult.id);
			assert.deepStrictEqual(submission.answers, TEST_DATA.answers);

			// Test get total submissions
			const count = await controllers.questionnaireService.getTotalSubmissions();
			assert.strictEqual(count, 10);

			// Test send notification
			await assert.doesNotReject(() => controllers.questionnaireService.sendNotification(submission));
		});
	});

	describe('Error Recovery Integration', () => {
		it('should recover from session errors', () => {
			const controllers = createQuestionnaireControllers(testSetup.portalService);

			// Set session error
			testSetup.request.session.questionnaires = {
				error: 'Test session error'
			};

			controllers.viewSuccessPage(testSetup.request, testSetup.response);

			// Should clear session and redirect
			assert.strictEqual((testSetup.response.redirect as any).mock.callCount(), 1);
			assert.strictEqual(
				(testSetup.response.redirect as any).mock.calls[0].arguments[0],
				'/questionnaire/check-your-answers'
			);
			assert.strictEqual(testSetup.request.session.questionnaires.error, undefined);
		});

		it('should handle missing session data', () => {
			const controllers = createQuestionnaireControllers(testSetup.portalService);

			controllers.viewSuccessPage(testSetup.request, testSetup.response);

			// Should redirect to start
			assert.strictEqual((testSetup.response.redirect as any).mock.callCount(), 1);
			assert.strictEqual((testSetup.response.redirect as any).mock.calls[0].arguments[0], '/questionnaire');
		});
	});
});
