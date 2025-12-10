import { mock } from 'node:test';
import type { Request, Response } from 'express';
import type { Logger } from 'pino';
import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import type { QuestionnaireSubmission } from './types.ts';

/**
 * Creates a mock database object for testing questionnaire functionality
 */
export const createMockDb = (): PrismaClient =>
	({
		questionnaire: {
			count: mock.fn(),
			create: mock.fn(),
			findMany: mock.fn(),
			findUnique: mock.fn(),
			update: mock.fn(),
			delete: mock.fn()
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
 * Creates a mock manage service for testing
 */
export const createMockManageService = () => {
	const dbClient = createMockDb();
	const logger = createMockLogger();

	return {
		logger,
		dbClient,
		get db() {
			return this.dbClient;
		}
	};
};

/**
 * Creates a mock request object for testing
 */
export const createMockRequest = (overrides = {}): Request =>
	({
		params: {},
		query: {},
		body: {},
		headers: {},
		session: {},
		...overrides
	}) as Request;

/**
 * Creates a mock response object for testing
 */
export const createMockResponse = (): Response => {
	const response = {
		render: mock.fn(),
		redirect: mock.fn(),
		status: mock.fn(() => response),
		json: mock.fn(() => response),
		locals: {},
		// Helper to reset response mocks
		resetMocks: () => {
			(response.render as any).mock?.resetCalls?.();
			(response.redirect as any).mock?.resetCalls?.();
			(response.status as any).mock?.resetCalls?.();
			(response.json as any).mock?.resetCalls?.();
		}
	};

	return response as unknown as Response;
};

/**
 * Test data constants
 */
export const TEST_DATA = {
	submission: {
		id: 'test-submission-123',
		createdAt: new Date('2024-01-01T00:00:00Z'),
		fullName: 'John Doe',
		email: 'john@example.com',
		rating: '5',
		feedback: 'Great service!',
		isDeleted: false
	} as QuestionnaireSubmission,

	submissions: [
		{
			id: 'test-submission-1',
			createdAt: new Date('2024-01-01T00:00:00Z'),
			fullName: 'John Doe',
			email: 'john@example.com',
			rating: '5',
			feedback: 'Great service!',
			isDeleted: false
		},
		{
			id: 'test-submission-2',
			createdAt: new Date('2024-01-02T00:00:00Z'),
			fullName: 'Jane Smith',
			email: null,
			rating: '4',
			feedback: 'Good experience',
			isDeleted: false
		}
	] as QuestionnaireSubmission[]
};

/**
 * Type for complete controller test setup
 */
type ControllerTestSetup = {
	manageService: ReturnType<typeof createMockManageService>;
	request: Request;
	response: Response;
	resetAllMocks: () => void;
};

/**
 * Helper to create a complete mock setup for controller tests
 */
export const createControllerTestSetup = (): ControllerTestSetup => {
	const manageService = createMockManageService();
	const request = createMockRequest();
	const response = createMockResponse();

	return {
		manageService,
		request,
		response,
		// Reset all mocks at once
		resetAllMocks: () => {
			// Reset manage service mocks
			(manageService.logger.info as any).mock?.resetCalls?.();
			(manageService.logger.warn as any).mock?.resetCalls?.();
			(manageService.logger.error as any).mock?.resetCalls?.();
			(manageService.logger.debug as any).mock?.resetCalls?.();
			(manageService.dbClient.questionnaire.count as any).mock?.resetCalls?.();
			(manageService.dbClient.questionnaire.findMany as any).mock?.resetCalls?.();
			(manageService.dbClient.questionnaire.findUnique as any).mock?.resetCalls?.();
			(manageService.dbClient.questionnaire.update as any).mock?.resetCalls?.();
			// Reset response mocks
			(response as any).resetMocks();
		}
	};
};

/**
 * Helper to reset all mocks in a test setup
 */
export const resetAllTestMocks = (setup: ReturnType<typeof createControllerTestSetup>): void => {
	setup.resetAllMocks();
};
