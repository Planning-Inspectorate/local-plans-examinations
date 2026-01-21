import type { Request, Response } from 'express';
import type { Logger } from 'pino';
import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import type { Mock } from 'node:test';

/**
 * Type for mock database operations used in testing
 */
export interface MockDatabase {
	feedback: {
		create: Mock<(...args: any[]) => any>;
		count: Mock<(...args: any[]) => any>;
		findMany?: Mock<(...args: any[]) => any>;
		findUnique?: Mock<(...args: any[]) => any>;
		update?: Mock<(...args: any[]) => any>;
		delete?: Mock<(...args: any[]) => any>;
	};
	$queryRaw?: Mock<(...args: any[]) => any>;
	$executeRaw?: Mock<(...args: any[]) => any>;
}

/**
 * Type for mock logger used in testing
 */
export interface MockLogger {
	info: Mock<(...args: any[]) => any>;
	warn: Mock<(...args: any[]) => any>;
	error: Mock<(...args: any[]) => any>;
	debug: Mock<(...args: any[]) => any>;
	fatal?: Mock<(...args: any[]) => any>;
	trace?: Mock<(...args: any[]) => any>;
	level?: string;
	silent?: boolean;
}

/**
 * Type for mock Express request used in testing
 */
export interface MockRequest {
	session: Record<string, any>;
	baseUrl: string;
	params?: Record<string, string>;
	query?: Record<string, any>;
	body?: Record<string, any>;
	headers?: Record<string, string>;
	method?: string;
	url?: string;
	path?: string;
}

/**
 * Type for mock Express response used in testing
 */
export interface MockResponse {
	render: Mock<(...args: any[]) => any>;
	redirect: Mock<(...args: any[]) => any>;
	status?: Mock<(...args: any[]) => any>;
	send?: Mock<(...args: any[]) => any>;
	json?: Mock<(...args: any[]) => any>;
	locals: Record<string, any>;
	statusCode?: number;
}

/**
 * Type for mock portal service used in testing
 */
export interface MockPortalService {
	logger: Logger;
	dbClient: PrismaClient;
	redisClient: any;
	'#config': any;
	get db(): PrismaClient;
	get cacheControl(): { maxAge: string };
	get gitSha(): string;
	get secureSession(): boolean;
	get sessionSecret(): string;
	get staticDir(): string;
}

/**
 * Type for feedback data service interface
 */
export interface FeedbackDataService {
	saveSubmission(answers: Record<string, any>): Promise<{ id: string; createdAt: Date }>;
	getTotalSubmissions(): Promise<number>;
}

/**
 * Type for feedback business service interface
 */
export interface FeedbackBusinessService {
	saveSubmission(answers: Record<string, any>): Promise<{
		id: string;
		reference: string;
		answers: Record<string, any>;
		submittedAt: Date;
	}>;
	sendNotification(submission: any): Promise<void>;
	getTotalSubmissions(): Promise<number>;
}

/**
 * Helper type to create properly typed mock functions
 */
export type MockFunction<T extends (...args: any[]) => any> = Mock<T>;

/**
 * Utility type to convert interface to mock version
 */
export type MockOf<T> = {
	[K in keyof T]: T[K] extends (...args: any[]) => any ? MockFunction<T[K]> : T[K] extends object ? MockOf<T[K]> : T[K];
};

/**
 * Type-safe mock creation helpers
 */
export interface TestMockHelpers {
	createMockRequest(): Request;
	createMockResponse(): Response;
	createMockLogger(): Logger;
	createMockDatabase(): PrismaClient;
	createMockPortalService(): MockPortalService;
}
