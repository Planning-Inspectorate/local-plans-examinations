import { mock } from 'node:test';
import type { Request, Response } from 'express';
import type { Logger } from 'pino';
import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import type { QuestionnaireAnswers, QuestionnaireSubmission } from './core/service.ts';
import type { MockPortalService, QuestionnaireBusinessService } from '../../../types/test-types.ts';

/**
 * Creates a mock database object for testing questionnaire functionality
 */
export const createMockDb = (): PrismaClient =>
	({
		questionnaire: {
			create: mock.fn(),
			count: mock.fn()
		},
		$queryRaw: mock.fn()
	}) as unknown as PrismaClient;

/**
 * Creates a mock logger object for testing
 */
export const createMockLogger = (): Logger =>
	({
		info: mock.fn(),
		warn: mock.fn(),
		error: mock.fn(),
		debug: mock.fn(),
		fatal: mock.fn(),
		trace: mock.fn(),
		level: 'info',
		silent: false
	}) as unknown as Logger;

/**
 * Creates a mock portal service for testing
 */
export const createMockPortalService = (): MockPortalService => {
	const dbClient = createMockDb();
	const logger = createMockLogger();

	return {
		logger,
		dbClient,
		redisClient: null,
		'#config': {},
		get db() {
			return this.dbClient;
		},
		get cacheControl() {
			return { maxAge: '1d' };
		},
		get gitSha() {
			return 'test-sha';
		},
		get secureSession() {
			return false;
		},
		get sessionSecret() {
			return 'test-secret';
		},
		get staticDir() {
			return '/test/static';
		}
	};
};

/**
 * Creates a mock request object for testing
 */
export const createMockRequest = (): Request =>
	({
		session: {},
		baseUrl: '/questionnaire'
	}) as Request;

/**
 * Creates a mock response object for testing
 */
export const createMockResponse = (): Response => {
	const response = {
		render: mock.fn(),
		redirect: mock.fn(),
		locals: {},
		// Helper to reset response mocks
		resetMocks: () => {
			response.render.mock.resetCalls();
			response.redirect.mock.resetCalls();
		}
	};

	return response as unknown as Response;
};

/**
 * Creates a mock questionnaire service for testing
 */
export const createMockQuestionnaireService = (): QuestionnaireBusinessService =>
	({
		saveSubmission: mock.fn(),
		sendNotification: mock.fn(),
		getTotalSubmissions: mock.fn()
	}) as unknown as QuestionnaireBusinessService;

/**
 * Mock questions for testing questionnaire functionality
 */
export const MOCK_QUESTIONS = {
	fullName: {
		type: 'single-line-input',
		title: 'Full Name',
		question: 'What is your full name?',
		fieldName: 'fullName',
		url: 'full-name',
		validators: []
	},
	wantToProvideEmail: {
		type: 'boolean',
		title: 'Email Contact',
		question: 'Would you like to provide your email address for updates?',
		fieldName: 'wantToProvideEmail',
		url: 'want-email',
		validators: []
	},
	email: {
		type: 'single-line-input',
		title: 'Email Address',
		question: 'What is your email address?',
		fieldName: 'email',
		url: 'email',
		validators: []
	},
	rating: {
		type: 'radio',
		title: 'Overall Rating',
		question: 'How would you rate your experience?',
		fieldName: 'rating',
		url: 'rating',
		validators: [],
		options: [
			{ text: 'Excellent', value: 'excellent' },
			{ text: 'Good', value: 'good' },
			{ text: 'Average', value: 'average' },
			{ text: 'Poor', value: 'poor' }
		]
	},
	feedback: {
		type: 'text-entry',
		title: 'Feedback',
		question: 'Please provide your feedback',
		fieldName: 'feedback',
		url: 'feedback',
		validators: []
	}
};

/**
 * Test data constants
 */
export const TEST_DATA = {
	answers: {
		fullName: 'John Doe',
		email: 'john@example.com',
		wantToProvideEmail: true,
		rating: 'excellent',
		feedback: 'Great service!'
	} as QuestionnaireAnswers,

	submission: {
		id: 'test-id-123',
		reference: 'test-ref-123',
		answers: {
			fullName: 'John Doe',
			email: 'john@example.com',
			wantToProvideEmail: true,
			rating: 'excellent',
			feedback: 'Great service!'
		},
		submittedAt: new Date('2024-01-01T00:00:00Z')
	} as QuestionnaireSubmission,

	dbResult: {
		id: 'test-id-123',
		createdAt: new Date('2024-01-01T00:00:00Z')
	},

	mockResponse: {
		answers: {
			fullName: 'John Doe',
			rating: 'excellent'
		}
	}
};

/**
 * Type for complete controller test setup
 */
type ControllerTestSetup = {
	portalService: MockPortalService;
	request: Request;
	response: Response;
	service: QuestionnaireBusinessService;
	resetAllMocks: () => void;
};

/**
 * Helper to create a complete mock setup for controller tests
 */
export const createControllerTestSetup = (): ControllerTestSetup => {
	const portalService = createMockPortalService();
	const request = createMockRequest();
	const response = createMockResponse();
	const service = createMockQuestionnaireService();

	return {
		portalService,
		request,
		response,
		service,
		// Reset all mocks at once
		resetAllMocks: () => {
			// Reset portal service mocks
			(portalService.logger.info as any).mock?.resetCalls?.();
			(portalService.logger.warn as any).mock?.resetCalls?.();
			(portalService.logger.error as any).mock?.resetCalls?.();
			(portalService.logger.debug as any).mock?.resetCalls?.();
			(portalService.dbClient.questionnaire.create as any).mock?.resetCalls?.();
			(portalService.dbClient.questionnaire.count as any).mock?.resetCalls?.();
			// Reset response mocks
			(response.render as any).mock?.resetCalls?.();
			(response.redirect as any).mock?.resetCalls?.();
			// Reset service mocks
			(service.saveSubmission as any).mock?.resetCalls?.();
			(service.sendNotification as any).mock?.resetCalls?.();
			(service.getTotalSubmissions as any).mock?.resetCalls?.();
		}
	};
};

/**
 * Helper to reset all mocks in a test setup
 */
export const resetAllTestMocks = (setup: ReturnType<typeof createControllerTestSetup>): void => {
	setup.resetAllMocks();
};
