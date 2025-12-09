import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { createDeleteConfirmController, createDeleteController } from './delete.ts';
import type { ManageService } from '#service';
import type { Request, Response } from 'express';

describe('Delete Controllers', () => {
	describe('createDeleteConfirmController', () => {
		it('should display delete confirmation page with submission details', async () => {
			const mockSubmission = {
				id: 'test-id',
				fullName: 'John Doe',
				email: 'john@example.com',
				rating: 'excellent',
				feedback: 'Great',
				isDeleted: false,
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const findUniqueMock = mock.fn(() => Promise.resolve(mockSubmission));
			const mockService = {
				db: { questionnaire: { findUnique: findUniqueMock } },
				logger: { info: mock.fn(), warn: mock.fn() }
			} as unknown as ManageService;

			const mockRequest = { params: { id: 'test-id' } } as Request;
			const renderMock = mock.fn();
			const mockResponse = { render: renderMock } as unknown as Response;

			const controller = createDeleteConfirmController(mockService);
			await controller(mockRequest, mockResponse);

			assert.strictEqual(renderMock.mock.callCount(), 1);
			assert.strictEqual(renderMock.mock.calls[0].arguments[0], 'views/questionnaire/templates/delete-confirm.njk');
			const renderData = renderMock.mock.calls[0].arguments[1];
			assert.strictEqual(renderData.pageHeading, 'Delete Questionnaire Submission');
			assert.deepStrictEqual(renderData.submission, mockSubmission);
		});

		it('should return 404 for non-existent submission', async () => {
			const findUniqueMock = mock.fn(() => Promise.resolve(null));
			const mockService = {
				db: { questionnaire: { findUnique: findUniqueMock } },
				logger: { info: mock.fn(), warn: mock.fn() }
			} as unknown as ManageService;

			const mockRequest = { params: { id: 'non-existent' } } as Request;
			const statusMock = mock.fn(() => mockResponse);
			const renderMock = mock.fn();
			const mockResponse = { status: statusMock, render: renderMock } as unknown as Response;

			const controller = createDeleteConfirmController(mockService);
			await controller(mockRequest, mockResponse);

			assert.strictEqual(statusMock.mock.callCount(), 1);
			assert.strictEqual(statusMock.mock.calls[0].arguments[0], 404);
			assert.strictEqual(renderMock.mock.callCount(), 1);
			assert.strictEqual(renderMock.mock.calls[0].arguments[0], 'views/errors/404.njk');
		});

		it('should handle database errors', async () => {
			const findUniqueMock = mock.fn(() => Promise.reject(new Error('Database error')));
			const mockService = {
				db: { questionnaire: { findUnique: findUniqueMock } },
				logger: { info: mock.fn(), warn: mock.fn() }
			} as unknown as ManageService;

			const mockRequest = { params: { id: 'test-id' } } as Request;
			const mockResponse = {} as Response;

			const controller = createDeleteConfirmController(mockService);
			await assert.rejects(() => controller(mockRequest, mockResponse), /Database error/);
		});
	});

	describe('createDeleteController', () => {
		it('should delete submission and set success message', async () => {
			const updateMock = mock.fn(() => Promise.resolve({}));
			const mockService = {
				db: { questionnaire: { update: updateMock } },
				logger: { info: mock.fn(), error: mock.fn() }
			} as unknown as ManageService;

			const mockSession = {};
			const mockRequest = { params: { id: 'test-id' }, session: mockSession } as any;
			const redirectMock = mock.fn();
			const mockResponse = { redirect: redirectMock } as unknown as Response;

			const controller = createDeleteController(mockService);
			await controller(mockRequest, mockResponse);

			assert.strictEqual(updateMock.mock.callCount(), 1);
			assert.deepStrictEqual(updateMock.mock.calls[0].arguments[0], {
				where: { id: 'test-id' },
				data: { isDeleted: true }
			});
			assert.strictEqual(mockSession.successMessage, 'Questionnaire submission deleted successfully');
			assert.strictEqual(redirectMock.mock.callCount(), 1);
			assert.strictEqual(redirectMock.mock.calls[0].arguments[0], '/questionnaire');
		});

		it('should set error message on database failure', async () => {
			const updateMock = mock.fn(() => Promise.reject(new Error('Database error')));
			const mockService = {
				db: { questionnaire: { update: updateMock } },
				logger: { info: mock.fn(), error: mock.fn() }
			} as unknown as ManageService;

			const mockSession = {};
			const mockRequest = { params: { id: 'test-id' }, session: mockSession } as any;
			const redirectMock = mock.fn();
			const mockResponse = { redirect: redirectMock } as unknown as Response;

			const controller = createDeleteController(mockService);
			await controller(mockRequest, mockResponse);

			assert.strictEqual(mockSession.errorMessage, 'Failed to delete submission');
			assert.strictEqual(redirectMock.mock.callCount(), 1);
			assert.strictEqual(redirectMock.mock.calls[0].arguments[0], '/questionnaire/test-id');
		});

		it('should log operations correctly', async () => {
			const updateMock = mock.fn(() => Promise.resolve({}));
			const infoMock = mock.fn();
			const mockService = {
				db: { questionnaire: { update: updateMock } },
				logger: { info: infoMock, error: mock.fn() }
			} as unknown as ManageService;

			const mockRequest = { params: { id: 'test-id' }, session: {} } as any;
			const mockResponse = { redirect: mock.fn() } as unknown as Response;

			const controller = createDeleteController(mockService);
			await controller(mockRequest, mockResponse);

			assert.ok(infoMock.mock.callCount() >= 2);
		});
	});
});
