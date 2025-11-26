// Test utilities and helpers for questionnaire module

import { mock } from 'node:test';
import { mockLogger } from '@pins/local-plans-lib/testing/mock-logger.ts';
import type { QuestionnaireAnswers, QuestionnaireSubmission } from './data/types.ts';

export const createMockRequest = (sessionData: any = {}) => ({
	session: sessionData
});

// Mock response with render/redirect tracking
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

export const createMockPortalService = (overrides: any = {}) => ({
	logger: mockLogger(),
	db: {},
	...overrides
});

export const createTestAnswers = (overrides: Partial<QuestionnaireAnswers> = {}): QuestionnaireAnswers => ({
	fullName: 'Test User',
	email: 'test@example.com',
	rating: 'good',
	feedback: 'Test feedback',
	...overrides
});

export const createTestSubmission = (overrides: Partial<QuestionnaireSubmission> = {}): QuestionnaireSubmission => ({
	id: 'test-id',
	reference: 'test-ref',
	answers: createTestAnswers(),
	submittedAt: new Date('2024-01-01'),
	...overrides
});

// Session data builders for different test scenarios
export const SessionDataBuilder = {
	empty: () => ({}),

	withSubmission: (reference = 'test-ref') => ({
		questionnaires: {
			lastReference: reference,
			submitted: true
		}
	}),

	withError: (error = 'Test error') => ({
		questionnaires: {
			error
		}
	})
};

// Assertion helpers for common test patterns
export const AssertionHelpers = {
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

	assertRedirect: (mockResponse: any, expectedUrl: string) => {
		if (mockResponse.redirectUrl !== expectedUrl) {
			throw new Error(`Expected redirect to ${expectedUrl}, got ${mockResponse.redirectUrl}`);
		}
	}
};
