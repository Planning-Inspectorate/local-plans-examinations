import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { loadSubmissionData } from './edit-helpers.ts';
import type { ManageService } from '#service';
import type { Request } from 'express';

describe('edit-helpers', () => {
	describe('loadSubmissionData', () => {
		it('should load and format submission data with email', async () => {
			const findUniqueMock = mock.fn();
			const mockSubmission = {
				id: 'test-id',
				fullName: 'John Doe',
				email: 'john@example.com',
				rating: 'excellent',
				feedback: 'Great service',
				isDeleted: false,
				createdAt: new Date(),
				updatedAt: new Date()
			};

			findUniqueMock.mock.mockImplementation(() => Promise.resolve(mockSubmission));

			const mockService = {
				db: {
					questionnaire: {
						findUnique: findUniqueMock
					}
				}
			} as unknown as ManageService;

			const mockRequest = {
				params: { id: 'test-id' }
			} as Request;

			const result = await loadSubmissionData(mockRequest, mockService);

			assert.deepStrictEqual(result, {
				fullName: 'John Doe',
				email: 'john@example.com',
				wantToProvideEmail: true,
				rating: 'excellent',
				feedback: 'Great service'
			});

			assert.strictEqual(findUniqueMock.mock.calls.length, 1);
			assert.deepStrictEqual(findUniqueMock.mock.calls[0].arguments[0], {
				where: { id: 'test-id', isDeleted: false }
			});
		});

		it('should load and format submission data without email', async () => {
			const findUniqueMock = mock.fn();
			const mockSubmission = {
				id: 'test-id',
				fullName: 'Jane Doe',
				email: null,
				rating: 'good',
				feedback: 'Nice',
				isDeleted: false,
				createdAt: new Date(),
				updatedAt: new Date()
			};

			findUniqueMock.mock.mockImplementation(() => Promise.resolve(mockSubmission));

			const mockService = {
				db: {
					questionnaire: {
						findUnique: findUniqueMock
					}
				}
			} as unknown as ManageService;

			const mockRequest = {
				params: { id: 'test-id' }
			} as Request;

			const result = await loadSubmissionData(mockRequest, mockService);

			assert.deepStrictEqual(result, {
				fullName: 'Jane Doe',
				email: null,
				wantToProvideEmail: false,
				rating: 'good',
				feedback: 'Nice'
			});
		});

		it('should return null when submission not found', async () => {
			const findUniqueMock = mock.fn();
			findUniqueMock.mock.mockImplementation(() => Promise.resolve(null));

			const mockService = {
				db: {
					questionnaire: {
						findUnique: findUniqueMock
					}
				}
			} as unknown as ManageService;

			const mockRequest = {
				params: { id: 'test-id' }
			} as Request;

			const result = await loadSubmissionData(mockRequest, mockService);

			assert.strictEqual(result, null);
		});

		it('should return null when submission is deleted', async () => {
			const findUniqueMock = mock.fn();
			findUniqueMock.mock.mockImplementation(() => Promise.resolve(null));

			const mockService = {
				db: {
					questionnaire: {
						findUnique: findUniqueMock
					}
				}
			} as unknown as ManageService;

			const mockRequest = {
				params: { id: 'test-id' }
			} as Request;

			const result = await loadSubmissionData(mockRequest, mockService);

			assert.strictEqual(result, null);
			assert.deepStrictEqual(findUniqueMock.mock.calls[0].arguments[0], {
				where: { id: 'test-id', isDeleted: false }
			});
		});

		it('should throw ApplicationError on database failure', async () => {
			const findUniqueMock = mock.fn(() => Promise.reject(new Error('Database connection failed')));
			const errorMock = mock.fn();
			const mockService = {
				db: { questionnaire: { findUnique: findUniqueMock } },
				logger: { error: errorMock }
			} as unknown as ManageService;

			const mockRequest = { params: { id: 'test-id' } } as Request;

			await assert.rejects(() => loadSubmissionData(mockRequest, mockService), /This page is temporarily unavailable/);

			assert.ok(errorMock.mock.callCount() >= 1);
		});

		it('should log errors with submission ID', async () => {
			const findUniqueMock = mock.fn(() => Promise.reject(new Error('DB error')));
			const errorMock = mock.fn();
			const mockService = {
				db: { questionnaire: { findUnique: findUniqueMock } },
				logger: { error: errorMock }
			} as unknown as ManageService;

			const mockRequest = { params: { id: 'test-submission-123' } } as Request;

			try {
				await loadSubmissionData(mockRequest, mockService);
			} catch (error) {
				// Expected
			}

			assert.ok(errorMock.mock.callCount() >= 1);
			const errorCall = errorMock.mock.calls[0].arguments[0];
			assert.ok(errorCall.includes('test-submission-123'));
		});
	});

	describe('Data Transformation Edge Cases', () => {
		it('should set wantToProvideEmail to false for empty string email', async () => {
			const findUniqueMock = mock.fn();
			const mockSubmission = {
				id: 'test-id',
				fullName: 'John',
				email: '',
				rating: 'good',
				feedback: 'Nice',
				isDeleted: false,
				createdAt: new Date(),
				updatedAt: new Date()
			};

			findUniqueMock.mock.mockImplementation(() => Promise.resolve(mockSubmission));

			const mockService = {
				db: { questionnaire: { findUnique: findUniqueMock } }
			} as unknown as ManageService;

			const mockRequest = { params: { id: 'test-id' } } as Request;
			const result = await loadSubmissionData(mockRequest, mockService);

			assert.strictEqual(result?.wantToProvideEmail, false);
			assert.strictEqual(result?.email, '');
		});

		it('should handle fullName with special characters', async () => {
			const specialNames = ["O'Brien", 'Mary-Jane Watson', 'José García', 'François Müller'];

			for (const name of specialNames) {
				const findUniqueMock = mock.fn();
				const mockSubmission = {
					id: 'test-id',
					fullName: name,
					email: null,
					rating: 'good',
					feedback: 'Test',
					isDeleted: false,
					createdAt: new Date(),
					updatedAt: new Date()
				};

				findUniqueMock.mock.mockImplementation(() => Promise.resolve(mockSubmission));

				const mockService = {
					db: { questionnaire: { findUnique: findUniqueMock } }
				} as unknown as ManageService;

				const mockRequest = { params: { id: 'test-id' } } as Request;
				const result = await loadSubmissionData(mockRequest, mockService);

				assert.strictEqual(result?.fullName, name, `Should preserve: ${name}`);
			}
		});

		it('should handle feedback with newlines and special characters', async () => {
			const findUniqueMock = mock.fn();
			const complexFeedback = 'Line 1\nLine 2\nSpecial: £50 & €30';
			const mockSubmission = {
				id: 'test-id',
				fullName: 'John',
				email: null,
				rating: 'good',
				feedback: complexFeedback,
				isDeleted: false,
				createdAt: new Date(),
				updatedAt: new Date()
			};

			findUniqueMock.mock.mockImplementation(() => Promise.resolve(mockSubmission));

			const mockService = {
				db: { questionnaire: { findUnique: findUniqueMock } }
			} as unknown as ManageService;

			const mockRequest = { params: { id: 'test-id' } } as Request;
			const result = await loadSubmissionData(mockRequest, mockService);

			assert.strictEqual(result?.feedback, complexFeedback);
		});

		it('should handle all valid rating values', async () => {
			const validRatings = ['excellent', 'good', 'average', 'poor'];

			for (const rating of validRatings) {
				const findUniqueMock = mock.fn();
				const mockSubmission = {
					id: 'test-id',
					fullName: 'John',
					email: null,
					rating,
					feedback: 'Test',
					isDeleted: false,
					createdAt: new Date(),
					updatedAt: new Date()
				};

				findUniqueMock.mock.mockImplementation(() => Promise.resolve(mockSubmission));

				const mockService = {
					db: { questionnaire: { findUnique: findUniqueMock } }
				} as unknown as ManageService;

				const mockRequest = { params: { id: 'test-id' } } as Request;
				const result = await loadSubmissionData(mockRequest, mockService);

				assert.strictEqual(result?.rating, rating);
			}
		});

		it('should preserve whitespace in fullName', async () => {
			const findUniqueMock = mock.fn();
			const nameWithSpaces = '  John   Doe  ';
			const mockSubmission = {
				id: 'test-id',
				fullName: nameWithSpaces,
				email: null,
				rating: 'good',
				feedback: 'Test',
				isDeleted: false,
				createdAt: new Date(),
				updatedAt: new Date()
			};

			findUniqueMock.mock.mockImplementation(() => Promise.resolve(mockSubmission));

			const mockService = {
				db: { questionnaire: { findUnique: findUniqueMock } }
			} as unknown as ManageService;

			const mockRequest = { params: { id: 'test-id' } } as Request;
			const result = await loadSubmissionData(mockRequest, mockService);

			assert.strictEqual(result?.fullName, nameWithSpaces);
		});

		it('should handle maximum length feedback (2000 chars)', async () => {
			const findUniqueMock = mock.fn();
			const longFeedback = 'a'.repeat(2000);
			const mockSubmission = {
				id: 'test-id',
				fullName: 'John',
				email: null,
				rating: 'good',
				feedback: longFeedback,
				isDeleted: false,
				createdAt: new Date(),
				updatedAt: new Date()
			};

			findUniqueMock.mock.mockImplementation(() => Promise.resolve(mockSubmission));

			const mockService = {
				db: { questionnaire: { findUnique: findUniqueMock } }
			} as unknown as ManageService;

			const mockRequest = { params: { id: 'test-id' } } as Request;
			const result = await loadSubmissionData(mockRequest, mockService);

			assert.strictEqual(result?.feedback.length, 2000);
			assert.strictEqual(result?.feedback, longFeedback);
		});
	});
});
