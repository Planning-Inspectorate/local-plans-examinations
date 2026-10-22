import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import type { Request, Response } from 'express';
import type { NextFunction } from 'express';
import {
	buildGuardResubmissionPage,
	buildGetResubmissionPage,
	buildPostResubmission,
	buildGetUploadDocumentsPage,
	buildGetPreviousSubmissionPage,
	buildLoadResubmissionCase,
	buildGateway3ResubmissionMiddleware,
	handleMulterFileSizeError
} from './controller.ts';
import { GATEWAY_3_DECISION_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';
import { DOCUMENT_SET_ID } from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';

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

	it('resolves uploaded document download URLs from DB documents when session metadata lacks documentGuid', () => {
		const handler = buildGetResubmissionPage();
		const req = {
			params: { planReference: 'PLAN-001' },
			currentCase: {
				planTitle: 'Test Plan',
				gateway3Info: {
					submissions: [
						{ completionDate: new Date('2026-10-01'), decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED },
						{ completionDate: null, decision: null }
					]
				},
				documents: [
					{
						guid: 'db-doc-guid-1',
						name: 'case-id/gateway-3-document-2/uuid-file1.pdf',
						documentSetId: DOCUMENT_SET_ID.G3_DOCUMENT_2,
						latestDocumentVersion: { originalFilename: 'file1.pdf', fileName: 'file1.pdf', dateCreated: null }
					}
				]
			},
			session: {
				fileUploader: {
					'PLAN-001:resubmissionDocuments:2': {
						uploadedFiles: [
							{
								id: 'case-id/gateway-3-document-2/uuid-file1.pdf',
								fileName: 'file1.pdf',
								metadata: { journeyId: 'gateway3-resubmission' }
							}
						]
					}
				}
			}
		} as unknown as Request;
		const { res, calls } = buildMockResponse();

		handler(req, res, () => {});

		const data = calls[0].args[1] as Record<string, unknown>;
		const uploadedDocs = data.uploadedDocuments as { fileName: string; downloadUrl: string }[];
		assert.strictEqual(uploadedDocs.length, 1);
		assert.strictEqual(uploadedDocs[0].fileName, 'file1.pdf');
		assert.strictEqual(
			uploadedDocs[0].downloadUrl,
			'/manage-local-plans/PLAN-001/gateway-3-resubmission/download-document/db-doc-guid-1'
		);
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
			currentCase: {
				gateway3Info: {
					submissions: [
						{ decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED, completionDate: new Date() },
						{ decision: null, completionDate: null }
					]
				}
			},
			session: {
				fileUploader: {
					'PLAN-001:resubmissionDocuments:2': {
						uploadedFiles: [{ id: '1', name: 'test.pdf', originalFileName: 'test.pdf' }]
					}
				}
			}
		} as unknown as Request;
		const { res, calls } = buildMockResponse();

		handler(req, res, () => {});

		assert.strictEqual(calls[0].method, 'redirect');
		assert.ok((calls[0].args[0] as string).includes('declaration'));
		assert.ok((calls[0].args[0] as string).includes('from=resubmission'), 'expected from=resubmission query param');
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

	it('passes session errors to the template and clears them', () => {
		const handler = buildGetUploadDocumentsPage();
		const session: Record<string, unknown> = {
			fileUploader: {},
			errors: { 'upload-form': { msg: 'Errors encountered during file upload' } },
			errorSummary: [{ text: 'The selected file must be smaller than 250MB', href: '#upload-form' }]
		};
		const req = {
			params: { planReference: 'PLAN-001' },
			session
		} as unknown as Request;
		const { res, calls } = buildMockResponse();

		handler(req, res, () => {});

		const data = calls[0].args[1] as Record<string, unknown>;
		assert.deepStrictEqual(data.errors, { 'upload-form': { msg: 'Errors encountered during file upload' } });
		assert.deepStrictEqual(data.errorSummary, [
			{ text: 'The selected file must be smaller than 250MB', href: '#upload-form' }
		]);
		// Session errors should be cleared after reading
		assert.strictEqual(session.errors, undefined);
		assert.strictEqual(session.errorSummary, undefined);
	});

	it('does not pass errors when session has no errors', () => {
		const handler = buildGetUploadDocumentsPage();
		const req = {
			params: { planReference: 'PLAN-001' },
			session: { fileUploader: {} }
		} as unknown as Request;
		const { res, calls } = buildMockResponse();

		handler(req, res, () => {});

		const data = calls[0].args[1] as Record<string, unknown>;
		assert.strictEqual(data.errors, null);
		assert.strictEqual(data.errorSummary, null);
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
		assert.strictEqual((req as unknown as Record<string, unknown>).currentCase, mockCase);
	});
});

describe('buildGetPreviousSubmissionPage', () => {
	const makeReq = (submissionNumber: string, submissions: unknown[], documents: unknown[] = []) =>
		({
			params: { planReference: 'PLAN-001', submissionNumber },
			currentCase: {
				planTitle: 'East Borough Local Plan',
				email: 'lpa@example.com',
				gateway3Info: { submissions },
				documents
			}
		}) as unknown as Request;

	it('renders 404 for invalid submission number', () => {
		const handler = buildGetPreviousSubmissionPage();
		const req = makeReq('abc', [
			{ completionDate: new Date('2026-10-01'), decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED }
		]);
		const { res, calls } = buildMockResponse();

		handler(req, res, () => {});

		const statusCall = calls.find((c) => c.method === 'status');
		assert.strictEqual(statusCall?.args[0], 404);
	});

	it('renders 404 for submission number 0', () => {
		const handler = buildGetPreviousSubmissionPage();
		const req = makeReq('0', [
			{ completionDate: new Date('2026-10-01'), decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED }
		]);
		const { res, calls } = buildMockResponse();

		handler(req, res, () => {});

		const statusCall = calls.find((c) => c.method === 'status');
		assert.strictEqual(statusCall?.args[0], 404);
	});

	it('renders 404 for submission number exceeding total submissions', () => {
		const handler = buildGetPreviousSubmissionPage();
		const req = makeReq('5', [
			{ completionDate: new Date('2026-10-01'), decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED }
		]);
		const { res, calls } = buildMockResponse();

		handler(req, res, () => {});

		const statusCall = calls.find((c) => c.method === 'status');
		assert.strictEqual(statusCall?.args[0], 404);
	});

	it('renders 404 for current placeholder submission', () => {
		const handler = buildGetPreviousSubmissionPage();
		const req = makeReq('2', [
			{ completionDate: new Date('2026-10-01'), decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED },
			{ completionDate: null, decision: null }
		]);
		const { res, calls } = buildMockResponse();

		handler(req, res, () => {});

		const statusCall = calls.find((c) => c.method === 'status');
		assert.strictEqual(statusCall?.args[0], 404);
	});

	it('renders submission 1 detail page with required and optional document sections', () => {
		const handler = buildGetPreviousSubmissionPage();
		const submissions = [
			{ completionDate: new Date('2026-10-01T12:00:00Z'), decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED },
			{ completionDate: null, decision: null }
		];
		const documents = [
			{
				guid: 'report-guid',
				name: 'GW3Report.pdf',
				documentSetId: DOCUMENT_SET_ID.G3_DOCUMENT_1,
				isDeleted: false,
				latestDocumentVersion: {
					originalFilename: 'GW3Report.pdf',
					fileName: 'GW3Report.pdf',
					dateCreated: new Date('2026-10-15')
				}
			},
			{
				guid: 'plan-guid',
				name: 'proposed-local-plan.pdf',
				documentSetId: DOCUMENT_SET_ID.G3_PROPOSED_LOCAL_PLAN,
				isDeleted: false,
				latestDocumentVersion: {
					originalFilename: 'proposed-local-plan.pdf',
					fileName: 'proposed-local-plan.pdf',
					dateCreated: new Date('2026-10-01')
				}
			}
		];
		const req = makeReq('1', submissions, documents);
		const { res, calls } = buildMockResponse();

		handler(req, res, () => {});

		assert.strictEqual(calls[0].method, 'render');
		const [view, data] = calls[0].args as [string, Record<string, unknown>];
		assert.ok(view.includes('previous-submission.njk'));
		assert.strictEqual(data.submissionNumber, 1);
		assert.strictEqual(data.isInitialSubmission, true);
		assert.strictEqual(data.pageCaption, 'East Borough Local Plan');
		assert.strictEqual(data.submitter, 'lpa@example.com');
		assert.strictEqual(data.reportSubmissionNumber, 1);

		// Should have report documents
		const reportDocs = data.reportDocuments as Record<string, unknown>[];
		assert.strictEqual(reportDocs.length, 1);
		assert.strictEqual(reportDocs[0].fileName, 'GW3Report.pdf');

		// Should have required and optional document sections
		const sections = data.documentSections as { heading: string; documents: unknown[] }[];
		assert.strictEqual(sections.length, 2);
		assert.strictEqual(sections[0].heading, 'Required information');
		assert.strictEqual(sections[1].heading, 'Optional documents');

		// Required section should have 9 document rows
		assert.strictEqual(sections[0].documents.length, 9);

		// No previous submissions for submission 1
		const prevSubs = data.previousSubmissions as unknown[];
		assert.strictEqual(prevSubs.length, 0);

		// Should have a back link
		assert.strictEqual(data.backLinkUrl, '/manage-local-plans/PLAN-001/gateway-3-resubmission');
	});

	it('renders submission 2 detail page with BO report and LPA uploads from g3-document-2', () => {
		const handler = buildGetPreviousSubmissionPage();
		const submissions = [
			{ completionDate: new Date('2026-10-01T12:00:00Z'), decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED },
			{ completionDate: new Date('2026-10-20T14:30:00Z'), decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED },
			{ completionDate: null, decision: null }
		];
		const documents = [
			{
				guid: 'report-1-guid',
				name: 'GW3Report-Sub1.pdf',
				documentSetId: DOCUMENT_SET_ID.G3_DOCUMENT_1,
				isDeleted: false,
				latestDocumentVersion: {
					originalFilename: 'GW3Report-Sub1.pdf',
					fileName: 'GW3Report-Sub1.pdf',
					dateCreated: new Date('2026-10-15')
				}
			},
			// BO report for sub2 (non-deleted, remains after sync)
			{
				guid: 'bo-report-2-guid',
				name: 'GW3Report-Sub2.pdf',
				documentSetId: DOCUMENT_SET_ID.G3_DOCUMENT_2,
				isDeleted: false,
				latestDocumentVersion: {
					originalFilename: 'GW3Report-Sub2.pdf',
					fileName: 'GW3Report-Sub2.pdf',
					dateCreated: new Date('2026-10-22')
				}
			},
			// LPA uploads for sub2 (soft-deleted by BO sync)
			{
				guid: 'resub-doc-guid',
				name: 'updated-plan.pdf',
				documentSetId: DOCUMENT_SET_ID.G3_DOCUMENT_2,
				isDeleted: true,
				latestDocumentVersion: {
					originalFilename: 'updated-plan.pdf',
					fileName: 'updated-plan.pdf',
					dateCreated: new Date('2026-10-20')
				}
			},
			{
				guid: 'resub-doc-2-guid',
				name: 'extra-evidence.pdf',
				documentSetId: DOCUMENT_SET_ID.G3_DOCUMENT_2,
				isDeleted: true,
				latestDocumentVersion: {
					originalFilename: 'extra-evidence.pdf',
					fileName: 'extra-evidence.pdf',
					dateCreated: new Date('2026-10-20')
				}
			}
		];
		const req = makeReq('2', submissions, documents);
		const { res, calls } = buildMockResponse();

		handler(req, res, () => {});

		assert.strictEqual(calls[0].method, 'render');
		const [view, data] = calls[0].args as [string, Record<string, unknown>];
		assert.ok(view.includes('previous-submission.njk'));
		assert.strictEqual(data.submissionNumber, 2);
		assert.strictEqual(data.isInitialSubmission, false);
		assert.strictEqual(data.reportSubmissionNumber, 2);

		// Report documents: only non-deleted docs from g3-document-2 (BO report)
		const reportDocs = data.reportDocuments as Record<string, unknown>[];
		assert.strictEqual(reportDocs.length, 1);
		assert.strictEqual(reportDocs[0].fileName, 'GW3Report-Sub2.pdf');

		// Previous submissions only includes submissions BEFORE sub2
		const prevSubs = data.previousSubmissions as { number: number; url: string }[];
		assert.strictEqual(prevSubs.length, 1);
		assert.strictEqual(prevSubs[0].number, 1);
		assert.ok(prevSubs[0].url.includes('/submission/1'));

		// Resubmission documents: soft-deleted LPA uploads from g3-document-2
		const resubDocs = data.resubmissionDocuments as { fileName: string }[];
		assert.strictEqual(resubDocs.length, 2);
		assert.strictEqual(resubDocs[0].fileName, 'updated-plan.pdf');
		assert.strictEqual(resubDocs[1].fileName, 'extra-evidence.pdf');

		// No document sections for non-initial submission
		const sections = data.documentSections as unknown[];
		assert.strictEqual(sections.length, 0);
	});

	it('renders submission 3 with BO report, LPA uploads and previous submissions', () => {
		const handler = buildGetPreviousSubmissionPage();
		const submissions = [
			{ completionDate: new Date('2026-10-01T12:00:00Z'), decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED },
			{ completionDate: new Date('2026-10-20T14:30:00Z'), decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED },
			{ completionDate: new Date('2026-11-05T09:00:00Z'), decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED },
			{ completionDate: null, decision: null }
		];
		const documents = [
			{
				guid: 'report-1-guid',
				name: 'GW3Report-Sub1.pdf',
				documentSetId: DOCUMENT_SET_ID.G3_DOCUMENT_1,
				isDeleted: false,
				latestDocumentVersion: {
					originalFilename: 'GW3Report-Sub1.pdf',
					fileName: 'GW3Report-Sub1.pdf',
					dateCreated: new Date('2026-10-15')
				}
			},
			{
				guid: 'report-2-guid',
				name: 'GW3Report-Sub2.pdf',
				documentSetId: DOCUMENT_SET_ID.G3_DOCUMENT_2,
				isDeleted: false,
				latestDocumentVersion: {
					originalFilename: 'GW3Report-Sub2.pdf',
					fileName: 'GW3Report-Sub2.pdf',
					dateCreated: new Date('2026-10-25')
				}
			},
			// BO report for sub3 (non-deleted)
			{
				guid: 'bo-report-3-guid',
				name: 'GW3Report-Sub3.pdf',
				documentSetId: DOCUMENT_SET_ID.G3_DOCUMENT_3,
				isDeleted: false,
				latestDocumentVersion: {
					originalFilename: 'GW3Report-Sub3.pdf',
					fileName: 'GW3Report-Sub3.pdf',
					dateCreated: new Date('2026-11-10')
				}
			},
			// LPA upload for sub3 (soft-deleted by BO sync)
			{
				guid: 'resub3-doc-guid',
				name: 'sub3-updated-plan.pdf',
				documentSetId: DOCUMENT_SET_ID.G3_DOCUMENT_3,
				isDeleted: true,
				latestDocumentVersion: {
					originalFilename: 'sub3-updated-plan.pdf',
					fileName: 'sub3-updated-plan.pdf',
					dateCreated: new Date('2026-11-05')
				}
			}
		];
		const req = makeReq('3', submissions, documents);
		const { res, calls } = buildMockResponse();

		handler(req, res, () => {});

		const data = calls[0].args[1] as Record<string, unknown>;
		assert.strictEqual(data.submissionNumber, 3);
		assert.strictEqual(data.isInitialSubmission, false);

		// Report is from g3-document-3 (non-deleted BO report)
		assert.strictEqual(data.reportSubmissionNumber, 3);
		const reportDocs = data.reportDocuments as Record<string, unknown>[];
		assert.strictEqual(reportDocs.length, 1);
		assert.strictEqual(reportDocs[0].fileName, 'GW3Report-Sub3.pdf');

		// Previous submissions only includes sub1 and sub2 (before sub3)
		const prevSubs = data.previousSubmissions as { number: number; url: string }[];
		assert.strictEqual(prevSubs.length, 2);
		assert.strictEqual(prevSubs[0].number, 1);
		assert.ok(prevSubs[0].url.includes('/submission/1'));
		assert.strictEqual(prevSubs[1].number, 2);
		assert.ok(prevSubs[1].url.includes('/submission/2'));

		// Resubmission documents: soft-deleted LPA upload from g3-document-3
		const resubDocs = data.resubmissionDocuments as { fileName: string }[];
		assert.strictEqual(resubDocs.length, 1);
		assert.strictEqual(resubDocs[0].fileName, 'sub3-updated-plan.pdf');
	});
});

describe('buildGetResubmissionPage - previous submission URLs', () => {
	it('includes URLs in previous submissions for linking to detail pages', () => {
		const handler = buildGetResubmissionPage();
		const req = {
			params: { planReference: 'PLAN-001' },
			currentCase: {
				planTitle: 'Test Plan',
				gateway3Info: {
					submissions: [
						{ completionDate: new Date('2026-10-01'), decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED },
						{ completionDate: null, decision: null }
					]
				},
				documents: []
			},
			session: { fileUploader: {} }
		} as unknown as Request;
		const { res, calls } = buildMockResponse();

		handler(req, res, () => {});

		const data = calls[0].args[1] as Record<string, unknown>;
		const prevSubs = data.previousSubmissions as { number: number; url: string }[];
		assert.strictEqual(prevSubs.length, 1);
		assert.strictEqual(prevSubs[0].number, 1);
		assert.ok(prevSubs[0].url.includes('/submission/1'));
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
		assert.ok(middleware.getPreviousSubmissionPage, 'getPreviousSubmissionPage');
		assert.ok(middleware.downloadDocument, 'downloadDocument');
		assert.ok(middleware.upload, 'upload');
		assert.ok(middleware.uploadDocuments, 'uploadDocuments');
		assert.ok(middleware.deleteDocument, 'deleteDocument');
	});
});

describe('handleMulterFileSizeError', () => {
	it('redirects with session error when file size limit is exceeded', () => {
		const err = Object.assign(new Error('File too large'), { code: 'LIMIT_FILE_SIZE' });
		const req = {
			params: { planReference: 'PLAN-001' },
			session: {}
		} as unknown as Request;
		let redirectUrl = '';
		const res = { redirect: (url: string) => (redirectUrl = url) } as unknown as Response;
		const next = mock.fn() as unknown as NextFunction;

		handleMulterFileSizeError(err, req, res, next);

		assert.ok(redirectUrl.includes('/gateway-3-resubmission/additional-documents'));
		assert.ok(!redirectUrl.includes('?error='));
		assert.strictEqual((next as unknown as { mock: { callCount: () => number } }).mock.callCount(), 0);
		const session = req.session as unknown as {
			errors: Record<string, { msg: string }>;
			errorSummary: Array<{ text: string; href: string }>;
		};
		assert.ok(session.errors['upload-form']);
		assert.ok(session.errorSummary[0].text.includes('smaller than'));
		assert.ok(session.errorSummary[0].text.includes('250MB'));
		assert.strictEqual(session.errorSummary[0].href, '#upload-form');
	});

	it('calls next for non file-size errors', () => {
		const err = new Error('something else');
		const req = { params: {}, session: {} } as unknown as Request;
		const res = {} as unknown as Response;
		const next = mock.fn() as unknown as NextFunction;

		handleMulterFileSizeError(err, req, res, next);

		assert.strictEqual((next as unknown as { mock: { callCount: () => number } }).mock.callCount(), 1);
		assert.strictEqual(
			(next as unknown as { mock: { calls: Array<{ arguments: unknown[] }> } }).mock.calls[0].arguments[0],
			err
		);
	});
});
