import { buildSaveController } from './save.ts';
import { JOURNEY_ID } from './journey.ts';
import type { PortalService } from '#service';
import type { NextFunction, Request, Response } from 'express';
import assert from 'node:assert';
import { describe, it, mock, before } from 'node:test';

describe('buildSaveController', () => {
	let mockService: ReturnType<typeof createMockService>;
	let mockRequest: ReturnType<typeof createMockRequest>;
	let mockResponse: ReturnType<typeof createMockResponse>;

	before(() => {
		mockService = createMockService();
		mockRequest = createMockRequest();
		mockResponse = createMockResponse();
	});

	it('should log the submitted answers and clear the journey session', async () => {
		process.env.PORTAL_URL = 'http://localhost:3000';
		process.env.TEMPLATE_ID = 'template-123';

		const controller = buildSaveController(mockService as unknown as PortalService);
		await controller(
			mockRequest as unknown as Request,
			mockResponse as unknown as Response,
			mock.fn() as unknown as NextFunction
		);

		assert.strictEqual(mockService.db.case.create.mock.callCount(), 0);
		assert.strictEqual(mockService.notifyClient.sendEmail.mock.callCount(), 0);
		assert.strictEqual(mockService.logger.info.mock.callCount(), 1);
		assert.strictEqual(mockRequest.session.forms[JOURNEY_ID], undefined);
		assert.strictEqual(mockResponse.render.mock.callCount(), 0);
	});
});

function createMockService() {
	return {
		db: {
			case: {
				create: mock.fn(async () => ({ id: '123' }))
			}
		},
		notifyClient: {
			sendEmail: mock.fn(async () => ({}))
		},
		logger: {
			info: mock.fn(),
			warn: mock.fn(),
			error: mock.fn()
		}
	};
}

function createMockRequest() {
	return {
		session: {
			forms: {
				[JOURNEY_ID]: {
					gateway2CoverLetter: [{ id: 'file-1', fileName: 'cover-letter.pdf' }]
				}
			}
		},
		baseUrl: '/create-case'
	};
}

function createMockResponse() {
	return {
		locals: {
			journeyResponse: {
				answers: {
					gateway2CoverLetter: [{ id: 'file-1', fileName: 'cover-letter.pdf' }]
				}
			}
		},
		render: mock.fn()
	};
}
