import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import type { Request, Response } from 'express';
import {
	buildGuardResubmissionPage,
	buildGetResubmissionPage,
	buildPostResubmission,
	buildGetUploadDocumentsPage,
	buildLoadResubmissionCase,
	buildGateway3ResubmissionMiddleware
} from './controller.ts';
import { GATEWAY_3_DECISION_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';

function buildMockResponse() {
	const calls: { method: string; args: unknown[] }[] = [];
	const res = {
		locals: {} as Record<string, unknown>,
		render: (...args: unknown[]) => {
			calls.push({ method: 'render', args });
		},
		redirect: (...args: unknown[]) => {
			calls.push({ method: 'redirect', args });
		},
		status: (code: number) => {
			calls.push({ method: 'status', args: [code] });
			return res;
		}
	} as unknown as Response;
	return { res, calls };
}

describe('buildGuardResubmissionPage', () => {
	it('calls next when latest submission has resubmission required decision', () => {
		const handler = buildGuardResubmissionPage();
		const req = {
			params: { planReference: 'PLAN-001' },
			currentCase: {
				gateway3Info: {
					submissions: [{ decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED, completionDate: null }]
				}
			}
		} as unknown as Request;
		const { res } = buildMockResponse();
		let nextCalled = false;

		handler(req, res, () => {
			nextCalled = true;
		});

		assert.ok(nextCalled);
	});

	it('calls next when latest is a placeholder and previous submission was resubmission required', () => {
		const handler = buildGuardResubmissionPage();
		const req = {
			params: { planReference: 'PLAN-001' },
			currentCase: {
				gateway3Info: {
					submissions: [
						{ decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED, completionDate: new Date('2026-10-01') },
						{ decision: null, completionDate: null }
					]
				}
			}
		} as unknown as Request;
		const { res } = buildMockResponse();
		let nextCalled = false;

		handler(req, res, () => {
			nextCalled = true;
		});

		assert.ok(nextCalled);
	});

	it('redirects to plan page when no resubmission required', () => {
		const handler = buildGuardResubmissionPage();
		const req = {
			params: { planReference: 'PLAN-001' },
			currentCase: {
				gateway3Info: {
					submissions: [{ decision: GATEWAY_3_DECISION_ID.PROCEED_TO_EXAMINATION, completionDate: null }]
				}
			}
		} as unknown as Request;
		const { res, calls } = buildMockResponse();

		handler(req, res, () => {});

		assert.strictEqual(calls[0].method, 'redirect');
		assert.strictEqual(calls[0].args[0], '/manage-local-plans/PLAN-001');
	});

	it('redirects when there are no submissions', () => {
		const handler = buildGuardResubmissionPage();
		const req = {
			params: { planReference: 'PLAN-001' },
			currentCase: {
				gateway3Info: { submissions: [] }
			}
		} as unknown as Request;
		const { res, calls } = buildMockResponse();

		handler(req, res, () => {});

		assert.strictEqual(calls[0].method, 'redirect');
	});
});

describe('buildGetResubmissionPage', () => {
	it('renders the resubmission page with correct submission number and previous submissions', () => {
		const handler = buildGetResubmissionPage();
		const req = {
			params: { planReference: 'PLAN-001' },
			currentCase: {
				planTitle: 'East Borough Local Plan',
				gateway3Info: {
					submissions: [
						{
							completionDate: new Date('2026-10-01'),
							decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED
						}
					]
				},
				documents: []
			},
			session: { fileUploader: {} }
		} as unknown as Request;
		const { res, calls } = buildMockResponse();

		handler(req, res, () => {});

		assert.strictEqual(calls[0].method, 'render');
		const [view, data] = calls[0].args as [string, Record<string, unknown>];
		assert.ok(view.includes('resubmission.njk'));
		assert.strictEqual(data.submissionNumber, 2);
		assert.strictEqual(data.pageCaption, 'East Borough Local Plan');
		const previousSubmissions = data.previousSubmissions as { number: number }[];
		assert.strictEqual(previousSubmissions.length, 1);
		assert.strictEqual(previousSubmissions[0].number, 1);
	});

	it('sets backLinkUrl and saveAndComeBackUrl to plan overview', () => {
		const handler = buildGetResubmissionPage();
		const req = {
			params: { planReference: 'PLAN-001' },
			currentCase: {
				planTitle: 'Test Plan',
				gateway3Info: { submissions: [{ decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED }] },
				documents: []
			},
			session: { fileUploader: {} }
		} as unknown as Request;
		const { res, calls } = buildMockResponse();

		handler(req, res, () => {});

		const data = calls[0].args[1] as Record<string, unknown>;
		assert.strictEqual(data.backLinkUrl, '/manage-local-plans/PLAN-001');
		assert.strictEqual(data.saveAndComeBackUrl, '/manage-local-plans/PLAN-001');
	});
});

describe('buildPostResubmission', () => {
	it('renders error when no documents are uploaded', () => {
		const handler = buildPostResubmission();
		const req = {
			params: { planReference: 'PLAN-001' },
			currentCase: {
				planTitle: 'Test Plan',
				gateway3Info: { submissions: [{ decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED }] },
				documents: []
			},
			session: { fileUploader: {} }
		} as unknown as Request;
		const { res, calls } = buildMockResponse();

		handler(req, res, () => {});

		const statusCall = calls.find((c) => c.method === 'status');
		assert.strictEqual(statusCall?.args[0], 400);
		const renderCall = calls.find((c) => c.method === 'render');
		assert.ok(renderCall);
	});

	it('redirects to declaration when documents are uploaded', () => {
		const handler = buildPostResubmission();
		const req = {
			params: { planReference: 'PLAN-001' },
			session: {
				fileUploader: {
					'PLAN-001:resubmissionDocuments': {
						uploadedFiles: [{ id: '1', name: 'test.pdf', originalFileName: 'test.pdf' }]
					}
				}
			}
		} as unknown as Request;
		const { res, calls } = buildMockResponse();

		handler(req, res, () => {});

		assert.strictEqual(calls[0].method, 'redirect');
		assert.ok((calls[0].args[0] as string).includes('declaration'));
	});
});

describe('buildGetUploadDocumentsPage', () => {
	it('renders the upload page using the reusable file-uploader template', () => {
		const handler = buildGetUploadDocumentsPage();
		const req = {
			params: { planReference: 'PLAN-001' },
			session: { fileUploader: {} }
		} as unknown as Request;
		const { res, calls } = buildMockResponse();

		handler(req, res, () => {});

		assert.strictEqual(calls[0].method, 'render');
		const [view, data] = calls[0].args as [string, Record<string, unknown>];
		assert.ok(view.includes('file-uploader/index.njk'), 'expected reusable file-uploader template');
		assert.strictEqual(data.layoutTemplate, 'views/layouts/main.njk');
		assert.strictEqual(data.backLink, '/manage-local-plans/PLAN-001/gateway-3-resubmission');
		assert.strictEqual(data.currentUrl, '/manage-local-plans/PLAN-001/gateway-3-resubmission/additional-documents');
		const question = data.question as Record<string, unknown>;
		assert.strictEqual(question.question, 'Upload any new or updated documents');
	});
});

describe('buildLoadResubmissionCase', () => {
	it('renders 404 when plan reference is missing', async () => {
		const mockService = {
			db: { case: { findUnique: mock.fn(async () => null) } }
		};
		const handler = buildLoadResubmissionCase(
			mockService as unknown as Parameters<typeof buildLoadResubmissionCase>[0]
		);
		const req = { params: {} } as unknown as Request;
		const { res, calls } = buildMockResponse();

		await handler(req, res, () => {});

		const statusCall = calls.find((c) => c.method === 'status');
		assert.strictEqual(statusCall?.args[0], 404);
	});

	it('renders 404 when case is not found', async () => {
		const mockService = {
			db: { case: { findUnique: mock.fn(async () => null) } }
		};
		const handler = buildLoadResubmissionCase(
			mockService as unknown as Parameters<typeof buildLoadResubmissionCase>[0]
		);
		const req = { params: { planReference: 'PLAN-999' } } as unknown as Request;
		const { res, calls } = buildMockResponse();

		await handler(req, res, () => {});

		const statusCall = calls.find((c) => c.method === 'status');
		assert.strictEqual(statusCall?.args[0], 404);
	});

	it('sets currentCase on request and calls next when case found', async () => {
		const mockCase = { id: '123', reference: 'PLAN-001', gateway3Info: { submissions: [] }, documents: [] };
		const mockService = {
			db: { case: { findUnique: mock.fn(async () => mockCase) } }
		};
		const handler = buildLoadResubmissionCase(
			mockService as unknown as Parameters<typeof buildLoadResubmissionCase>[0]
		);
		const req = { params: { planReference: 'PLAN-001' } } as unknown as Request;
		const { res } = buildMockResponse();
		let nextCalled = false;

		await handler(req, res, () => {
			nextCalled = true;
		});

		assert.ok(nextCalled);
		assert.strictEqual((req as Record<string, unknown>).currentCase, mockCase);
	});
});

describe('buildGateway3ResubmissionMiddleware', () => {
	it('returns all expected middleware handlers', () => {
		const mockService = {
			db: { case: { findUnique: mock.fn() } },
			createFileStorage: mock.fn(() => ({
				upload: mock.fn(),
				download: mock.fn(),
				delete: mock.fn()
			}))
		};
		const middleware = buildGateway3ResubmissionMiddleware(
			mockService as unknown as Parameters<typeof buildGateway3ResubmissionMiddleware>[0]
		);

		assert.ok(middleware.loadCase, 'loadCase');
		assert.ok(middleware.guardResubmission, 'guardResubmission');
		assert.ok(middleware.getResubmissionPage, 'getResubmissionPage');
		assert.ok(middleware.postResubmission, 'postResubmission');
		assert.ok(middleware.getUploadPage, 'getUploadPage');
		assert.ok(middleware.postUploadPage, 'postUploadPage');
		assert.ok(middleware.upload, 'upload');
		assert.ok(middleware.uploadDocuments, 'uploadDocuments');
		assert.ok(middleware.deleteDocument, 'deleteDocument');
	});
});
