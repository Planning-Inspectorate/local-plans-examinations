import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createSaveToDatabase } from './save.ts';
import type { ManageService } from '#service';
import type { Request } from 'express';

describe('save controller', () => {
	describe('createSaveToDatabase', () => {
		let mockService: ManageService;
		let mockRequest: Request;
		let updateMock: ReturnType<typeof mock.fn>;
		let infoMock: ReturnType<typeof mock.fn>;
		let errorMock: ReturnType<typeof mock.fn>;

		beforeEach(() => {
			updateMock = mock.fn();
			infoMock = mock.fn();
			errorMock = mock.fn();
			mockService = {
				db: { questionnaire: { update: updateMock } },
				logger: { info: infoMock, error: errorMock }
			} as unknown as ManageService;
			mockRequest = { params: { id: 'test-submission-id' }, session: {} } as Request;
		});

		it('should update questionnaire submission with form data', async () => {
			const saveToDatabase = createSaveToDatabase(mockService);

			await saveToDatabase({
				req: mockRequest,
				journeyId: 'questionnaire',
				referenceId: 'test-ref',
				data: {
					answers: {
						fullName: 'John Doe',
						email: 'john@example.com',
						rating: 'excellent',
						feedback: 'Great service'
					}
				}
			});

			assert.strictEqual(updateMock.mock.calls.length, 1);
			const callArgs = updateMock.mock.calls[0].arguments[0];
			assert.deepStrictEqual(callArgs.where, { id: 'test-submission-id' });
			assert.strictEqual(callArgs.data.fullName, 'John Doe');
			assert.strictEqual(callArgs.data.email, 'john@example.com');
			assert.strictEqual(callArgs.data.rating, 'excellent');
			assert.strictEqual(callArgs.data.feedback, 'Great service');
			assert.ok(callArgs.data.updatedAt instanceof Date);
		});

		it('should set success message in session', async () => {
			const saveToDatabase = createSaveToDatabase(mockService);

			await saveToDatabase({
				req: mockRequest,
				journeyId: 'questionnaire',
				referenceId: 'test-ref',
				data: { answers: { fullName: 'Test', email: 'test@example.com', rating: 'good', feedback: 'Test' } }
			});

			assert.strictEqual(mockRequest.session.successMessage, 'Changes saved successfully');
		});

		it('should handle null email', async () => {
			const saveToDatabase = createSaveToDatabase(mockService);

			await saveToDatabase({
				req: mockRequest,
				journeyId: 'questionnaire',
				referenceId: 'test-ref',
				data: { answers: { fullName: 'Jane Doe', email: null, rating: 'good', feedback: 'Nice' } }
			});

			const callArgs = updateMock.mock.calls[0].arguments[0];
			assert.strictEqual(callArgs.data.email, null);
		});

		it('should handle empty string email as null', async () => {
			const saveToDatabase = createSaveToDatabase(mockService);

			await saveToDatabase({
				req: mockRequest,
				journeyId: 'questionnaire',
				referenceId: 'test-ref',
				data: { answers: { fullName: 'Test User', email: '', rating: 'poor', feedback: 'Bad' } }
			});

			const callArgs = updateMock.mock.calls[0].arguments[0];
			assert.strictEqual(callArgs.data.email, null);
		});

		it('should throw ApplicationError on database failure', async () => {
			updateMock.mock.mockImplementation(() => Promise.reject(new Error('Database connection failed')));
			const saveToDatabase = createSaveToDatabase(mockService);

			await assert.rejects(
				() =>
					saveToDatabase({
						req: mockRequest,
						journeyId: 'questionnaire',
						referenceId: 'test-ref',
						data: { answers: { fullName: 'Test', email: 'test@example.com', rating: 'good', feedback: 'Test' } }
					}),
				/Your changes could not be saved/
			);

			assert.ok(errorMock.mock.callCount() >= 1);
		});

		it('should not set success message on database failure', async () => {
			updateMock.mock.mockImplementation(() => Promise.reject(new Error('Database error')));
			const saveToDatabase = createSaveToDatabase(mockService);

			try {
				await saveToDatabase({
					req: mockRequest,
					journeyId: 'questionnaire',
					referenceId: 'test-ref',
					data: { answers: { fullName: 'Test', email: 'test@example.com', rating: 'good', feedback: 'Test' } }
				});
			} catch {
				// Expected error
			}

			assert.strictEqual(mockRequest.session.successMessage, undefined);
		});

		it('should log successful updates', async () => {
			const saveToDatabase = createSaveToDatabase(mockService);

			await saveToDatabase({
				req: mockRequest,
				journeyId: 'questionnaire',
				referenceId: 'test-ref',
				data: { answers: { fullName: 'Test', email: 'test@example.com', rating: 'good', feedback: 'Test' } }
			});

			assert.ok(infoMock.mock.callCount() >= 1);
		});
	});
});
