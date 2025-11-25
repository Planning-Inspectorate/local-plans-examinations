/**
 * Test utilities and helpers for questionnaire module
 *
 * Provides reusable mock factories, test data builders, and assertion helpers
 * to eliminate test code duplication across all questionnaire test files.
 * Implements enterprise-grade testing patterns.
 *
 * @example
 * ```typescript
 * import { createMockLogger, createTestAnswers, AssertionHelpers } from './test-helpers.ts';
 *
 * const mockLogger = createMockLogger();
 * const testData = createTestAnswers({ fullName: 'John Doe' });
 * AssertionHelpers.assertMockCalled(mockLogger.info, 1);
 * ```
 */

import { mock } from 'node:test';
import type { QuestionnaireAnswers, QuestionnaireSubmission } from './data/types.ts';

/**
 * Mock factory for creating Pino logger instances
 *
 * Creates a mock logger with all standard Pino methods for testing.
 * Focused solely on creating logger mocks for test isolation.
 *
 * @returns {Object} Mock logger with info, error, debug, warn methods
 *
 * @example
 * ```typescript
 * const mockLogger = createMockLogger();
 * service.doSomething();
 * AssertionHelpers.assertMockCalled(mockLogger.info, 1);
 * ```
 */
export const createMockLogger = () => ({
	info: mock.fn(),
	error: mock.fn(),
	debug: mock.fn(),
	warn: mock.fn()
});

/**
 * Mock factory for creating Express request objects
 *
 * Creates reusable request mocks with configurable session data.
 * Centralizes request mock creation for consistent test setup.
 *
 * @param {any} [sessionData={}] - Optional session data to include in request
 * @returns {Object} Mock Express request object with session
 *
 * @example
 * ```typescript
 * const mockReq = createMockRequest({ user: { id: '123' } });
 * const emptyReq = createMockRequest();
 * ```
 */
export const createMockRequest = (sessionData: any = {}) => ({
	session: sessionData
});

/**
 * Mock factory for creating Express response objects
 *
 * Creates reusable response mocks with spy functions for render and redirect.
 * Captures template names, data, and redirect URLs for assertion testing.
 * Provides consistent response mock structure across tests.
 *
 * @returns {Object} Mock Express response with render/redirect tracking
 * @returns {string} returns.renderTemplate - Last rendered template name
 * @returns {any} returns.renderData - Last rendered template data
 * @returns {string} returns.redirectUrl - Last redirect URL
 * @returns {Function} returns.render - Mock render function
 * @returns {Function} returns.redirect - Mock redirect function
 *
 * @example
 * ```typescript
 * const mockRes = createMockResponse();
 * controller.handleRequest(mockReq, mockRes);
 * AssertionHelpers.assertTemplateRendered(mockRes, 'success.njk');
 * ```
 */
export const createMockResponse = () => {
	const response = {
		renderTemplate: '',
		renderData: {} as any,
		redirectUrl: '',
		render: mock.fn((template: string, data: any) => {
			response.renderTemplate = template;
			response.renderData = data;
		}),
		redirect: mock.fn((url: string) => {
			response.redirectUrl = url;
		})
	};
	return response;
};

/**
 * Mock factory for creating database repository/adapter instances
 *
 * Creates mock repository with configurable return values for database operations.
 * Simple mock structure that preserves mock functions when applying overrides.
 * Used for testing data service layer in isolation.
 *
 * @param {any} [overrides={}] - Optional method overrides for custom behavior
 * @returns {Object} Mock repository with saveSubmission and getTotalSubmissions methods
 *
 * @example
 * ```typescript
 * const mockRepo = createMockRepository({
 *   saveSubmission: async () => ({ id: 'custom-id', createdAt: new Date() })
 * });
 * const service = new QuestionnaireService(mockLogger, mockRepo);
 * ```
 */
export const createMockRepository = (overrides: any = {}) => {
	const baseMocks = {
		saveSubmission: mock.fn(async () => ({ id: 'test-id', createdAt: new Date('2024-01-01') })),
		getTotalSubmissions: mock.fn(async () => 42)
	};

	// Apply overrides while preserving mock functions
	Object.keys(overrides).forEach((key) => {
		if (typeof overrides[key] === 'function') {
			(baseMocks as any)[key] = mock.fn(overrides[key]);
		} else {
			(baseMocks as any)[key] = overrides[key];
		}
	});

	return baseMocks;
};

/**
 * Mock factory for creating portal service instances
 *
 * Creates centralized portal service mock with logger and database client.
 * Provides consistent service mock structure across all controller and
 * integration tests.
 *
 * @param {any} [overrides={}] - Optional property overrides for custom behavior
 * @returns {Object} Mock portal service with logger and db properties
 *
 * @example
 * ```typescript
 * const mockService = createMockPortalService({
 *   db: { questionnaire: { create: mock.fn() } }
 * });
 * const controllers = createQuestionnaireControllers(mockService);
 * ```
 */
export const createMockPortalService = (overrides: any = {}) => ({
	logger: createMockLogger(),
	db: {},
	...overrides
});

/**
 * Test data builder for questionnaire answers
 *
 * Creates realistic questionnaire answer objects with sensible defaults.
 * Includes only essential test data while remaining extensible through
 * the overrides parameter.
 *
 * @param {Partial<QuestionnaireAnswers>} [overrides={}] - Optional property overrides
 * @returns {QuestionnaireAnswers} Complete questionnaire answers object
 *
 * @example
 * ```typescript
 * const defaultAnswers = createTestAnswers();
 * const customAnswers = createTestAnswers({
 *   fullName: 'John Doe',
 *   rating: 'excellent'
 * });
 * ```
 */
export const createTestAnswers = (overrides: Partial<QuestionnaireAnswers> = {}): QuestionnaireAnswers => ({
	fullName: 'Test User',
	email: 'test@example.com',
	rating: 'good',
	feedback: 'Test feedback',
	...overrides
});

/**
 * Test data builder for questionnaire submissions
 *
 * Creates complete questionnaire submission objects with metadata.
 * Provides reusable submission builder that includes answers, timestamps,
 * and reference information.
 *
 * @param {Partial<QuestionnaireSubmission>} [overrides={}] - Optional property overrides
 * @returns {QuestionnaireSubmission} Complete questionnaire submission object
 *
 * @example
 * ```typescript
 * const defaultSubmission = createTestSubmission();
 * const customSubmission = createTestSubmission({
 *   id: 'custom-id',
 *   answers: createTestAnswers({ fullName: 'Jane Doe' })
 * });
 * ```
 */
export const createTestSubmission = (overrides: Partial<QuestionnaireSubmission> = {}): QuestionnaireSubmission => ({
	id: 'test-id',
	reference: 'test-ref',
	answers: createTestAnswers(),
	submittedAt: new Date('2024-01-01'),
	...overrides
});

/**
 * Session data builder for different test scenarios
 *
 * Provides simple builders for common session states used in questionnaire testing.
 * Straightforward methods for typical session scenarios including empty sessions,
 * successful submissions, and error states.
 *
 * @example
 * ```typescript
 * const emptySession = SessionDataBuilder.empty();
 * const successSession = SessionDataBuilder.withSubmission('ref-123');
 * const errorSession = SessionDataBuilder.withError('Database failed');
 *
 * const mockReq = createMockRequest(successSession);
 * ```
 */
export const SessionDataBuilder = {
	/**
	 * Creates empty session data object
	 *
	 * @returns {Object} Empty session object
	 */
	empty: () => ({}),

	/**
	 * Creates session data with successful submission
	 *
	 * @param {string} [reference='test-ref'] - Submission reference ID
	 * @returns {Object} Session object with questionnaire submission data
	 */
	withSubmission: (reference = 'test-ref') => ({
		questionnaires: {
			lastReference: reference,
			submitted: true
		}
	}),

	/**
	 * Creates session data with error state
	 *
	 * @param {string} [error='Test error'] - Error message to store in session
	 * @returns {Object} Session object with questionnaire error data
	 */
	withError: (error = 'Test error') => ({
		questionnaires: {
			error
		}
	})
};

/**
 * Assertion helpers for common test patterns
 *
 * Provides reusable assertion patterns to eliminate code duplication across tests.
 * Centralizes common assertion logic with clear error messages for debugging
 * test failures.
 *
 * @example
 * ```typescript
 * // Assert mock function calls
 * AssertionHelpers.assertMockCalled(mockLogger.info, 1, ['Expected message']);
 *
 * // Assert template rendering
 * AssertionHelpers.assertTemplateRendered(mockRes, 'success.njk', { title: 'Success' });
 *
 * // Assert redirects
 * AssertionHelpers.assertRedirect(mockRes, '/questionnaire/success');
 * ```
 */
export const AssertionHelpers = {
	/**
	 * Asserts that a mock function was called with expected arguments
	 *
	 * Validates mock function call count and optionally checks the arguments
	 * passed to the first call. Provides clear error messages for debugging.
	 *
	 * @param {any} mockFn - Mock function to validate (must have .mock property)
	 * @param {number} expectedCallCount - Expected number of function calls
	 * @param {any[]} [expectedArgs] - Optional array of expected arguments for first call
	 * @throws {Error} If mock is invalid, call count doesn't match, or arguments don't match
	 *
	 * @example
	 * ```typescript
	 * const mockFn = mock.fn();
	 * mockFn('test', 123);
	 * AssertionHelpers.assertMockCalled(mockFn, 1, ['test', 123]);
	 * ```
	 */
	assertMockCalled: (mockFn: any, expectedCallCount: number, expectedArgs?: any[]) => {
		if (!mockFn?.mock) {
			throw new Error('Function is not a mock or mock not properly created');
		}
		if (mockFn.mock.callCount() !== expectedCallCount) {
			throw new Error(`Expected ${expectedCallCount} calls, got ${mockFn.mock.callCount()}`);
		}
		if (expectedArgs && mockFn.mock.calls[0]?.arguments) {
			const actualArgs = mockFn.mock.calls[0].arguments;
			expectedArgs.forEach((expectedArg, index) => {
				if (actualArgs[index] !== expectedArg) {
					throw new Error(`Expected argument ${index} to be ${expectedArg}, got ${actualArgs[index]}`);
				}
			});
		}
	},

	/**
	 * Asserts that a template was rendered with expected data
	 *
	 * Validates that the mock response rendered the expected template and
	 * optionally checks that specific data properties were passed to the template.
	 *
	 * @param {any} mockResponse - Mock response object from createMockResponse()
	 * @param {string} expectedTemplate - Expected template name/path to be rendered
	 * @param {any} [expectedData] - Optional object with expected template data properties
	 * @throws {Error} If template doesn't match or data properties don't match
	 *
	 * @example
	 * ```typescript
	 * const mockRes = createMockResponse();
	 * controller.render(mockRes);
	 * AssertionHelpers.assertTemplateRendered(mockRes, 'success.njk', {
	 *   pageTitle: 'Success',
	 *   reference: 'ref-123'
	 * });
	 * ```
	 */
	assertTemplateRendered: (mockResponse: any, expectedTemplate: string, expectedData?: any) => {
		if (!mockResponse.renderTemplate.includes(expectedTemplate)) {
			throw new Error(`Expected template to include ${expectedTemplate}, got ${mockResponse.renderTemplate}`);
		}
		if (expectedData) {
			Object.keys(expectedData).forEach((key) => {
				if (mockResponse.renderData[key] !== expectedData[key]) {
					throw new Error(`Expected ${key} to be ${expectedData[key]}, got ${mockResponse.renderData[key]}`);
				}
			});
		}
	},

	/**
	 * Asserts that a redirect occurred to expected URL
	 *
	 * Validates that the mock response performed a redirect to the expected URL.
	 * Used for testing controller redirect behavior in error and success scenarios.
	 *
	 * @param {any} mockResponse - Mock response object from createMockResponse()
	 * @param {string} expectedUrl - Expected redirect URL
	 * @throws {Error} If redirect URL doesn't match expected URL
	 *
	 * @example
	 * ```typescript
	 * const mockRes = createMockResponse();
	 * controller.handleError(mockReq, mockRes);
	 * AssertionHelpers.assertRedirect(mockRes, '/questionnaire/check-your-answers');
	 * ```
	 */
	assertRedirect: (mockResponse: any, expectedUrl: string) => {
		if (mockResponse.redirectUrl !== expectedUrl) {
			throw new Error(`Expected redirect to ${expectedUrl}, got ${mockResponse.redirectUrl}`);
		}
	}
};
