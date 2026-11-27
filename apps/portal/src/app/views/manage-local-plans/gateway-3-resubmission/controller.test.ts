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
	buildGetDeclarationPage,
	buildPostDeclarationPage,
	buildGetSubmissionCompletePage,
	buildLoadResubmissionCase,
	buildGateway3ResubmissionMiddleware,
	buildGuardSubmittedSubmission,
	buildResubmissionLanding,
	buildGetSubmittedResubmissionPage,
	handleMulterFileSizeError
} from './controller.ts';
import { GATEWAY_3_DECISION_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';
import { DOCUMENT_SET_ID } from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';
import { STATUS, StatusTag } from '../../../types.ts';

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
		assert.ok(
			(calls[0].args[0] as string).includes('gateway-3-resubmission/declaration'),
			'expected resubmission-specific declaration route'
		);
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

	it('renders submission 2 with report and LPA uploads from g3-document-2', () => {
		const handler = buildGetPreviousSubmissionPage();
		const submissions = [
			{ completionDate: new Date('2026-10-01T12:00:00Z'), decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED },
			{ completionDate: new Date('2026-10-20T14:30:00Z'), decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED },
			{ completionDate: null, decision: null }
		];
		const documents = [
			// BO report from reviewing sub2 (in g3-document-2)
			{
				guid: 'report-1-guid',
				name: 'GW3Report-Sub2.pdf',
				documentSetId: DOCUMENT_SET_ID.G3_DOCUMENT_2,
				isDeleted: false,
				latestDocumentVersion: {
					originalFilename: 'GW3Report-Sub2.pdf',
					fileName: 'GW3Report-Sub2.pdf',
					dateCreated: new Date('2026-10-15')
				}
			},
			// LPA uploads for sub2 (in g3-document-2, soft-deleted after BO sync)
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

		// Report: BO report for sub2 from g3-document-2
		const reportDocs = data.reportDocuments as Record<string, unknown>[];
		assert.strictEqual(reportDocs.length, 1);
		assert.strictEqual(reportDocs[0].fileName, 'GW3Report-Sub2.pdf');

		// Previous submissions only includes submissions BEFORE sub2
		const prevSubs = data.previousSubmissions as { number: number; url: string }[];
		assert.strictEqual(prevSubs.length, 1);
		assert.strictEqual(prevSubs[0].number, 1);
		assert.ok(prevSubs[0].url.includes('/submission/1'));

		// New or updated documents: soft-deleted LPA uploads from g3-document-2
		const resubDocs = data.resubmissionDocuments as { fileName: string }[];
		assert.strictEqual(resubDocs.length, 2);
		assert.strictEqual(resubDocs[0].fileName, 'updated-plan.pdf');
		assert.strictEqual(resubDocs[1].fileName, 'extra-evidence.pdf');

		// No document sections for non-initial submission
		const sections = data.documentSections as unknown[];
		assert.strictEqual(sections.length, 0);
	});

	it('renders submission 3 with report and LPA uploads from g3-document-3', () => {
		const handler = buildGetPreviousSubmissionPage();
		const submissions = [
			{ completionDate: new Date('2026-10-01T12:00:00Z'), decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED },
			{ completionDate: new Date('2026-10-20T14:30:00Z'), decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED },
			{ completionDate: new Date('2026-11-05T09:00:00Z'), decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED },
			{ completionDate: null, decision: null }
		];
		const documents = [
			// BO report from reviewing sub1 (g3-document-1)
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
			// BO report from reviewing sub2 (g3-document-2)
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
			// LPA uploads for sub3 (g3-document-3, soft-deleted after BO sync)
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
			},
			// BO report synced into g3-document-3 (non-deleted)
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
			}
		];
		const req = makeReq('3', submissions, documents);
		const { res, calls } = buildMockResponse();

		handler(req, res, () => {});

		const data = calls[0].args[1] as Record<string, unknown>;
		assert.strictEqual(data.submissionNumber, 3);
		assert.strictEqual(data.isInitialSubmission, false);

		// Report from g3-document-3 (the BO report for sub3)
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

		// New or updated documents: soft-deleted LPA upload from g3-document-3
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
		assert.ok(middleware.guardSubmittedSubmission, 'guardSubmittedSubmission');
		assert.ok(middleware.getResubmissionLanding, 'getResubmissionLanding');
		assert.ok(middleware.getResubmissionPage, 'getResubmissionPage');
		assert.ok(middleware.getSubmittedResubmissionPage, 'getSubmittedResubmissionPage');
		assert.ok(middleware.postResubmission, 'postResubmission');
		assert.ok(middleware.getUploadPage, 'getUploadPage');
		assert.ok(middleware.postUploadPage, 'postUploadPage');
		assert.ok(middleware.getDeclarationPage, 'getDeclarationPage');
		assert.ok(middleware.postDeclarationPage, 'postDeclarationPage');
		assert.ok(middleware.getSubmissionCompletePage, 'getSubmissionCompletePage');
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

describe('buildGetDeclarationPage', () => {
	it('renders the declaration page with correct heading and back link', () => {
		const handler = buildGetDeclarationPage();
		const req = {
			params: { planReference: 'PLAN-001' }
		} as unknown as Request;
		const { res, calls } = buildMockResponse();

		handler(req, res, () => {});

		assert.strictEqual(calls[0].method, 'render');
		const [view, data] = calls[0].args as [string, Record<string, unknown>];
		assert.ok(view.includes('declaration.njk'));
		assert.strictEqual(data.pageHeading, "Are you sure you're ready to submit?");
		assert.strictEqual(data.goBackUrl, '/manage-local-plans/PLAN-001/gateway-3-resubmission');
		assert.strictEqual(data.backLinkUrl, '/manage-local-plans/PLAN-001/gateway-3-resubmission');
	});
});

describe('buildPostDeclarationPage', () => {
	function buildDeclarationService() {
		return {
			db: {
				$transaction: mock.fn(async (updates: unknown[]) => Promise.all(updates)),
				gateway3Submission: { update: mock.fn(async () => ({})) },
				gateway3Info: { update: mock.fn(async () => ({})) },
				documentSet: {
					findMany: mock.fn(async ({ where }: { where: { folderName: { in: string[] } } }) =>
						where.folderName.in.map((folderName) => ({ id: `ds-${folderName}`, folderName }))
					)
				},
				document: { updateMany: mock.fn(async () => ({ count: 0 })) }
			},
			logger: { error: mock.fn() }
		};
	}

	function buildPendingResubmissionRequest() {
		return {
			params: { planReference: 'PLAN-001' },
			currentCase: {
				id: 'case-1',
				gateway3Info: {
					submissions: [
						{
							id: 'sub-1',
							completionDate: new Date('2026-10-01'),
							submittedDate: null,
							decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED
						},
						{ id: 'sub-2', completionDate: null, submittedDate: null, decision: null }
					]
				}
			}
		} as unknown as Request;
	}

	it('updates the submission and gateway3Info.actualDate in a transaction and redirects', async () => {
		const mockService = buildDeclarationService();
		const submissionUpdateMock = mockService.db.gateway3Submission.update;
		const gateway3InfoUpdateMock = mockService.db.gateway3Info.update;
		const transactionMock = mockService.db.$transaction;
		const handler = buildPostDeclarationPage(mockService as unknown as Parameters<typeof buildPostDeclarationPage>[0]);
		const req = buildPendingResubmissionRequest();
		const { res, calls } = buildMockResponse();

		await handler(req, res, () => {});

		// Should use a transaction
		assert.strictEqual(transactionMock.mock.callCount(), 1);

		// Should have updated the placeholder submission with a submittedDate (not completionDate)
		assert.strictEqual(submissionUpdateMock.mock.callCount(), 1);
		const submissionUpdateCall = (
			submissionUpdateMock.mock.calls as unknown as {
				arguments: [{ where: { id: string }; data: { submittedDate: Date } }];
			}[]
		)[0].arguments[0];
		assert.strictEqual(submissionUpdateCall.where.id, 'sub-2');
		assert.ok(submissionUpdateCall.data.submittedDate instanceof Date);

		// Should have updated gateway3Info.actualDate
		assert.strictEqual(gateway3InfoUpdateMock.mock.callCount(), 1);
		const gateway3InfoUpdateCall = (
			gateway3InfoUpdateMock.mock.calls as unknown as {
				arguments: [{ where: { caseId: string }; data: { actualDate: Date } }];
			}[]
		)[0].arguments[0];
		assert.strictEqual(gateway3InfoUpdateCall.where.caseId, 'case-1');
		assert.strictEqual(gateway3InfoUpdateCall.data.actualDate, submissionUpdateCall.data.submittedDate);

		// Should redirect to submission complete
		const redirectCall = calls.find((c) => c.method === 'redirect');
		assert.ok(redirectCall);
		assert.ok((redirectCall.args[0] as string).includes('submission-complete'));
	});

	it('commits only the current resubmission document set in the same transaction', async () => {
		const mockService = buildDeclarationService();
		const handler = buildPostDeclarationPage(mockService as unknown as Parameters<typeof buildPostDeclarationPage>[0]);
		const { res } = buildMockResponse();

		await handler(buildPendingResubmissionRequest(), res, () => {});

		const { db } = mockService;
		assert.deepStrictEqual(db.documentSet.findMany.mock.calls[0].arguments[0].where.folderName.in, [
			'gateway-3-document-2'
		]);
		assert.strictEqual(db.$transaction.mock.calls[0].arguments[0].length, 3);
		assert.deepStrictEqual(db.document.updateMany.mock.calls[0].arguments[0], {
			where: {
				caseId: 'case-1',
				documentSetId: { in: ['ds-gateway-3-document-2'] },
				isTemp: true,
				isDeleted: false
			},
			data: { isTemp: false }
		});
	});

	it('returns 500 without submitting when the document set lookup fails', async () => {
		const mockService = buildDeclarationService();
		mockService.db.documentSet.findMany.mock.mockImplementation(async () => []);
		const handler = buildPostDeclarationPage(mockService as unknown as Parameters<typeof buildPostDeclarationPage>[0]);
		const { res, calls } = buildMockResponse();
		(res as unknown as Record<string, unknown>).send = (body: string) => {
			calls.push({ method: 'send', args: [body] });
		};

		await handler(buildPendingResubmissionRequest(), res, () => {});

		assert.strictEqual(calls.find((c) => c.method === 'status')?.args[0], 500);
		assert.deepStrictEqual(calls.find((c) => c.method === 'send')?.args, ['Failed to record submission']);
		assert.strictEqual(mockService.db.$transaction.mock.callCount(), 0);
		assert.strictEqual(mockService.logger.error.mock.callCount(), 1);
	});

	it('returns 500 when no pending submission exists', async () => {
		const mockService = {
			db: {
				$transaction: mock.fn(),
				gateway3Submission: { update: mock.fn() },
				gateway3Info: { update: mock.fn() }
			},
			logger: { error: mock.fn() }
		};
		const handler = buildPostDeclarationPage(mockService as unknown as Parameters<typeof buildPostDeclarationPage>[0]);
		const req = {
			params: { planReference: 'PLAN-001' },
			currentCase: {
				id: 'case-1',
				gateway3Info: {
					submissions: [
						{
							id: 'sub-1',
							completionDate: new Date('2026-10-01'),
							decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED
						}
					]
				}
			}
		} as unknown as Request;
		const { res, calls } = buildMockResponse();
		(res as unknown as Record<string, unknown>).send = (body: string) => {
			calls.push({ method: 'send', args: [body] });
		};

		await handler(req, res, () => {});

		const statusCall = calls.find((c) => c.method === 'status');
		assert.strictEqual(statusCall?.args[0], 500);
	});

	it('returns 500 when no caseId is available', async () => {
		const mockService = {
			db: {
				$transaction: mock.fn(),
				gateway3Submission: { update: mock.fn() },
				gateway3Info: { update: mock.fn() }
			},
			logger: { error: mock.fn() }
		};
		const handler = buildPostDeclarationPage(mockService as unknown as Parameters<typeof buildPostDeclarationPage>[0]);
		const req = {
			params: { planReference: 'PLAN-001' },
			currentCase: {
				gateway3Info: {
					submissions: [{ id: 'sub-1', completionDate: null, submittedDate: null, decision: null }]
				}
			}
		} as unknown as Request;
		const { res, calls } = buildMockResponse();
		(res as unknown as Record<string, unknown>).send = (body: string) => {
			calls.push({ method: 'send', args: [body] });
		};

		await handler(req, res, () => {});

		const statusCall = calls.find((c) => c.method === 'status');
		assert.strictEqual(statusCall?.args[0], 500);
	});
});

describe('buildGetSubmissionCompletePage', () => {
	it('renders the submission complete page with plan overview link', () => {
		const handler = buildGetSubmissionCompletePage();
		const req = {
			params: { planReference: 'PLAN-001' }
		} as unknown as Request;
		const { res, calls } = buildMockResponse();

		handler(req, res, () => {});

		assert.strictEqual(calls[0].method, 'render');
		const [view, data] = calls[0].args as [string, Record<string, unknown>];
		assert.ok(view.includes('submission-complete.njk'));
		assert.strictEqual(data.planOverviewUrl, '/manage-local-plans/PLAN-001');
	});
});

// ---------------------------------------------------------------------------
// Gateway 3 under review / complete (after a resubmission)
// ---------------------------------------------------------------------------

type TestSubmission = {
	submittedDate: Date | null;
	completionDate: Date | null;
	decision: string | null;
};

function buildTestDocument(
	guid: string,
	documentSetId: string,
	fileName: string,
	isDeleted: boolean,
	dateCreated: Date
) {
	return {
		guid,
		name: `case-1/${documentSetId}/${guid}-${fileName}`,
		documentSetId,
		isDeleted,
		latestDocumentVersion: { originalFilename: fileName, fileName, dateCreated }
	};
}

/** Submissions 1 and 2 needed resubmission; submission 3 has been sent and is under review. */
function buildUnderReviewSubmissions(): TestSubmission[] {
	return [
		{
			submittedDate: new Date('2026-06-20T12:00:00Z'),
			completionDate: new Date('2026-06-25T12:00:00Z'),
			decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED
		},
		{
			submittedDate: new Date('2026-07-01T12:00:00Z'),
			completionDate: new Date('2026-07-13T12:00:00Z'),
			decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED
		},
		{ submittedDate: new Date('2026-07-20T12:00:00Z'), completionDate: null, decision: null }
	];
}

function buildUnderReviewDocuments() {
	return [
		buildTestDocument(
			'report-1',
			DOCUMENT_SET_ID.G3_DOCUMENT_1,
			'report-1.pdf',
			false,
			new Date('2026-06-25T12:00:00Z')
		),
		// LPA uploads for submission 2, soft-deleted when the BO saved its report into the set
		buildTestDocument('lpa-2a', DOCUMENT_SET_ID.G3_DOCUMENT_2, 'lpa-2a.pdf', true, new Date('2026-07-01T12:00:00Z')),
		buildTestDocument('lpa-2b', DOCUMENT_SET_ID.G3_DOCUMENT_2, 'lpa-2b.pdf', true, new Date('2026-07-01T12:00:00Z')),
		buildTestDocument(
			'report-2',
			DOCUMENT_SET_ID.G3_DOCUMENT_2,
			'report-2.pdf',
			false,
			new Date('2026-07-13T12:00:00Z')
		),
		// LPA uploads for submission 3 (no BO report yet, so still active)
		buildTestDocument(
			'new-1',
			DOCUMENT_SET_ID.G3_DOCUMENT_3,
			'new-document-1.pdf',
			false,
			new Date('2026-07-20T12:00:00Z')
		),
		buildTestDocument(
			'new-2',
			DOCUMENT_SET_ID.G3_DOCUMENT_3,
			'new-document-2.pdf',
			false,
			new Date('2026-07-20T12:00:00Z')
		)
	];
}

/** Same history, but the BO issued "proceed to examination" on submission 3. */
function buildCompleteSubmissions(): TestSubmission[] {
	const submissions = buildUnderReviewSubmissions();
	submissions[2] = {
		...submissions[2],
		completionDate: new Date('2026-08-03T12:00:00Z'),
		decision: GATEWAY_3_DECISION_ID.PROCEED_TO_EXAMINATION
	};
	return submissions;
}

function buildCompleteDocuments() {
	return [
		...buildUnderReviewDocuments().map((doc) =>
			doc.documentSetId === DOCUMENT_SET_ID.G3_DOCUMENT_3 ? { ...doc, isDeleted: true } : doc
		),
		buildTestDocument(
			'report-3',
			DOCUMENT_SET_ID.G3_DOCUMENT_3,
			'report-3.pdf',
			false,
			new Date('2026-08-03T12:00:00Z')
		)
	];
}

function buildResubmissionRequest(
	submissions: unknown[],
	documents: unknown[] = [],
	params: Record<string, string> = {}
) {
	return {
		params: { planReference: 'PLAN-001', ...params },
		currentCase: {
			planTitle: 'East Borough Local Plan',
			email: 'lpa@example.com',
			gateway3Info: { submissions },
			documents
		},
		session: { fileUploader: {} }
	} as unknown as Request;
}

describe('buildGuardSubmittedSubmission', () => {
	function runGuard(submissions: unknown[]) {
		const handler = buildGuardSubmittedSubmission();
		const { res, calls } = buildMockResponse();
		const next = mock.fn();
		handler(buildResubmissionRequest(submissions), res, next as unknown as NextFunction);
		return { calls, next };
	}

	it('calls next while the resubmission is open', () => {
		const { next, calls } = runGuard([
			{
				submittedDate: null,
				completionDate: new Date('2026-06-25T12:00:00Z'),
				decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED
			},
			{ submittedDate: null, completionDate: null, decision: null }
		]);
		assert.strictEqual(next.mock.callCount(), 1);
		assert.strictEqual(calls.length, 0);
	});

	it('calls next when the resubmission is under review', () => {
		const { next } = runGuard(buildUnderReviewSubmissions());
		assert.strictEqual(next.mock.callCount(), 1);
	});

	it('calls next when gateway 3 is complete', () => {
		const { next } = runGuard(buildCompleteSubmissions());
		assert.strictEqual(next.mock.callCount(), 1);
	});

	it('redirects to the plan page when there are no submissions', () => {
		const { next, calls } = runGuard([]);
		assert.strictEqual(next.mock.callCount(), 0);
		assert.strictEqual(calls[0].method, 'redirect');
		assert.strictEqual(calls[0].args[0], '/manage-local-plans/PLAN-001');
	});

	it('redirects to the plan page when the only submission has not been sent', () => {
		const { next, calls } = runGuard([{ submittedDate: null, completionDate: null, decision: null }]);
		assert.strictEqual(next.mock.callCount(), 0);
		assert.strictEqual(calls[0].method, 'redirect');
	});
});

describe('buildResubmissionLanding', () => {
	function runLanding(submissions: unknown[]) {
		const resubmissionPage = mock.fn();
		const submittedResubmissionPage = mock.fn();
		const handler = buildResubmissionLanding(
			resubmissionPage as unknown as Parameters<typeof buildResubmissionLanding>[0],
			submittedResubmissionPage as unknown as Parameters<typeof buildResubmissionLanding>[1]
		);
		const { res, calls } = buildMockResponse();
		handler(buildResubmissionRequest(submissions), res, () => {});
		return { resubmissionPage, submittedResubmissionPage, calls };
	}

	it('shows the editable resubmission page when the latest submission needs resubmission', () => {
		const { resubmissionPage, submittedResubmissionPage } = runLanding([
			{
				submittedDate: null,
				completionDate: new Date('2026-06-25T12:00:00Z'),
				decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED
			}
		]);
		assert.strictEqual(resubmissionPage.mock.callCount(), 1);
		assert.strictEqual(submittedResubmissionPage.mock.callCount(), 0);
	});

	it('shows the editable resubmission page for the BO-created placeholder submission', () => {
		const { resubmissionPage, submittedResubmissionPage } = runLanding([
			{
				submittedDate: null,
				completionDate: new Date('2026-06-25T12:00:00Z'),
				decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED
			},
			{ submittedDate: null, completionDate: null, decision: null }
		]);
		assert.strictEqual(resubmissionPage.mock.callCount(), 1);
		assert.strictEqual(submittedResubmissionPage.mock.callCount(), 0);
	});

	it('shows the read-only page once the resubmission is under review', () => {
		const { resubmissionPage, submittedResubmissionPage } = runLanding(buildUnderReviewSubmissions());
		assert.strictEqual(resubmissionPage.mock.callCount(), 0);
		assert.strictEqual(submittedResubmissionPage.mock.callCount(), 1);
	});

	it('shows the read-only page once gateway 3 is complete', () => {
		const { resubmissionPage, submittedResubmissionPage } = runLanding(buildCompleteSubmissions());
		assert.strictEqual(resubmissionPage.mock.callCount(), 0);
		assert.strictEqual(submittedResubmissionPage.mock.callCount(), 1);
	});

	it('redirects to the plan page when only the initial submission exists', () => {
		const { resubmissionPage, submittedResubmissionPage, calls } = runLanding([
			{
				submittedDate: null,
				completionDate: new Date('2026-06-25T12:00:00Z'),
				decision: GATEWAY_3_DECISION_ID.PROCEED_TO_EXAMINATION
			}
		]);
		assert.strictEqual(resubmissionPage.mock.callCount(), 0);
		assert.strictEqual(submittedResubmissionPage.mock.callCount(), 0);
		assert.strictEqual(calls[0].method, 'redirect');
		assert.strictEqual(calls[0].args[0], '/manage-local-plans/PLAN-001');
	});

	it('redirects to the plan page when there are no submissions', () => {
		const { calls } = runLanding([]);
		assert.strictEqual(calls[0].method, 'redirect');
		assert.strictEqual(calls[0].args[0], '/manage-local-plans/PLAN-001');
	});
});

describe('buildGetSubmittedResubmissionPage', () => {
	type ReportView = {
		submissionNumber: number;
		issuedDate: string;
		files: { fileName: string; downloadUrl: string }[];
	};
	type PreviousSubmissionView = { submissionNumber: number; submittedDate: string; url: string };

	function renderSubmittedPage(submissions: unknown[], documents: unknown[], params: Record<string, string> = {}) {
		const handler = buildGetSubmittedResubmissionPage();
		const { res, calls } = buildMockResponse();
		handler(buildResubmissionRequest(submissions, documents, params), res, () => {});
		assert.strictEqual(calls[0].method, 'render');
		return calls[0].args as [string, Record<string, unknown>];
	}

	it('renders the submitted resubmission view with heading, caption and under review tag', () => {
		const [view, data] = renderSubmittedPage(buildUnderReviewSubmissions(), buildUnderReviewDocuments());

		assert.ok(view.endsWith('gateway-3-resubmission/resubmission-submitted.njk'));
		assert.strictEqual(data.submissionNumber, 3);
		assert.strictEqual(data.pageCaption, 'East Borough Local Plan');
		assert.deepStrictEqual(data.statusTag, StatusTag[STATUS.UnderReview]);
		assert.strictEqual(data.backLinkUrl, '/manage-local-plans/PLAN-001');
	});

	it('lists BO reports newest first with a short issued date', () => {
		const [, data] = renderSubmittedPage(buildUnderReviewSubmissions(), buildUnderReviewDocuments());
		const reports = data.reports as ReportView[];

		assert.deepStrictEqual(
			reports.map((report) => report.submissionNumber),
			[2, 1]
		);
		assert.strictEqual(reports[0].issuedDate, '13 Jul 2026');
		assert.deepStrictEqual(reports[0].files, [
			{
				fileName: 'report-2.pdf',
				downloadUrl: '/manage-local-plans/PLAN-001/gateway-3-resubmission/download-document/report-2'
			}
		]);
		assert.strictEqual(reports[1].issuedDate, '25 Jun 2026');
	});

	it('does not treat the LPA uploads of the submission under review as a report', () => {
		const [, data] = renderSubmittedPage(buildUnderReviewSubmissions(), buildUnderReviewDocuments());
		const reports = data.reports as ReportView[];

		assert.ok(!reports.some((report) => report.submissionNumber === 3));
		const reportFileNames = reports.flatMap((report) => report.files.map((file) => file.fileName));
		assert.ok(!reportFileNames.includes('new-document-1.pdf'));
	});

	it('omits a report row when a decided submission has no report documents', () => {
		const documents = buildUnderReviewDocuments().filter((doc) => doc.guid !== 'report-1');
		const [, data] = renderSubmittedPage(buildUnderReviewSubmissions(), documents);

		assert.deepStrictEqual(
			(data.reports as ReportView[]).map((report) => report.submissionNumber),
			[2]
		);
	});

	it('passes every file when a report has more than one document', () => {
		const documents = [
			...buildUnderReviewDocuments(),
			buildTestDocument(
				'report-1b',
				DOCUMENT_SET_ID.G3_DOCUMENT_1,
				'report-1-annex.pdf',
				false,
				new Date('2026-06-25T12:00:00Z')
			)
		];
		const [, data] = renderSubmittedPage(buildUnderReviewSubmissions(), documents);
		const submission1Report = (data.reports as ReportView[]).find((report) => report.submissionNumber === 1);

		assert.deepStrictEqual(
			submission1Report?.files.map((file) => file.fileName),
			['report-1.pdf', 'report-1-annex.pdf']
		);
	});

	it('lists previous submissions newest first with submitted dates and detail links', () => {
		const [, data] = renderSubmittedPage(buildUnderReviewSubmissions(), buildUnderReviewDocuments());

		assert.deepStrictEqual(data.previousSubmissions as PreviousSubmissionView[], [
			{
				submissionNumber: 2,
				submittedDate: '1 Jul 2026',
				url: '/manage-local-plans/PLAN-001/gateway-3-resubmission/submission/2'
			},
			{
				submissionNumber: 1,
				submittedDate: '20 Jun 2026',
				url: '/manage-local-plans/PLAN-001/gateway-3-resubmission/submission/1'
			}
		]);
	});

	it('falls back to the completion date when a previous submission has no submitted date', () => {
		const submissions = buildUnderReviewSubmissions();
		submissions[0] = { ...submissions[0], submittedDate: null };
		const [, data] = renderSubmittedPage(submissions, buildUnderReviewDocuments());
		const previousSubmissions = data.previousSubmissions as PreviousSubmissionView[];

		assert.strictEqual(previousSubmissions[1].submittedDate, '25 Jun 2026');
	});

	it('shows the latest submission date, submitter and its new or updated documents', () => {
		const [, data] = renderSubmittedPage(buildUnderReviewSubmissions(), buildUnderReviewDocuments());

		assert.strictEqual(data.currentSubmissionDate, '20 July 2026');
		assert.strictEqual(data.submitter, 'lpa@example.com');
		assert.deepStrictEqual(data.newDocuments, [
			{
				fileName: 'new-document-1.pdf',
				downloadUrl: '/manage-local-plans/PLAN-001/gateway-3-resubmission/download-document/new-1'
			},
			{
				fileName: 'new-document-2.pdf',
				downloadUrl: '/manage-local-plans/PLAN-001/gateway-3-resubmission/download-document/new-2'
			}
		]);
	});

	it('renders the completed tag and every report once gateway 3 is complete', () => {
		const [, data] = renderSubmittedPage(buildCompleteSubmissions(), buildCompleteDocuments());
		const reports = data.reports as ReportView[];

		assert.deepStrictEqual(data.statusTag, StatusTag[STATUS.Completed]);
		assert.deepStrictEqual(
			reports.map((report) => report.submissionNumber),
			[3, 2, 1]
		);
		assert.strictEqual(reports[0].issuedDate, '3 Aug 2026');
		assert.deepStrictEqual(
			(data.previousSubmissions as PreviousSubmissionView[]).map((submission) => submission.submissionNumber),
			[2, 1]
		);
	});

	it('keeps showing the soft-deleted LPA uploads (not the BO report) as new documents once complete', () => {
		const [, data] = renderSubmittedPage(buildCompleteSubmissions(), buildCompleteDocuments());

		assert.deepStrictEqual(
			(data.newDocuments as { fileName: string }[]).map((doc) => doc.fileName),
			['new-document-1.pdf', 'new-document-2.pdf']
		);
	});

	it('encodes the plan reference in links', () => {
		const [, data] = renderSubmittedPage(buildUnderReviewSubmissions(), buildUnderReviewDocuments(), {
			planReference: 'PLAN 001'
		});
		const previousSubmissions = data.previousSubmissions as PreviousSubmissionView[];

		assert.strictEqual(data.backLinkUrl, '/manage-local-plans/PLAN%20001');
		assert.ok(previousSubmissions[0].url.startsWith('/manage-local-plans/PLAN%20001/'));
	});
});

describe('buildGetPreviousSubmissionPage - status and report rules', () => {
	function renderPreviousPage(submissionNumber: string, submissions: unknown[], documents: unknown[] = []) {
		const handler = buildGetPreviousSubmissionPage();
		const { res, calls } = buildMockResponse();
		handler(buildResubmissionRequest(submissions, documents, { submissionNumber }), res, () => {});
		assert.strictEqual(calls[0].method, 'render');
		return calls[0].args[1] as Record<string, unknown>;
	}

	it('passes the resubmission required tag while the resubmission is open', () => {
		const data = renderPreviousPage('1', [
			{
				submittedDate: null,
				completionDate: new Date('2026-06-25T12:00:00Z'),
				decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED
			},
			{ submittedDate: null, completionDate: null, decision: null }
		]);
		assert.deepStrictEqual(data.statusTag, StatusTag[STATUS.ResubmissionRequired]);
	});

	it('passes the under review tag once the resubmission has been sent', () => {
		const data = renderPreviousPage('1', buildUnderReviewSubmissions(), buildUnderReviewDocuments());
		assert.deepStrictEqual(data.statusTag, StatusTag[STATUS.UnderReview]);
	});

	it('passes the completed tag once gateway 3 is complete', () => {
		const data = renderPreviousPage('2', buildCompleteSubmissions(), buildCompleteDocuments());
		assert.deepStrictEqual(data.statusTag, StatusTag[STATUS.Completed]);
	});

	it('shows no report and lists the active LPA uploads for a submission still under review', () => {
		const data = renderPreviousPage('3', buildUnderReviewSubmissions(), buildUnderReviewDocuments());

		assert.deepStrictEqual(data.reportDocuments, []);
		assert.deepStrictEqual(
			(data.resubmissionDocuments as { fileName: string }[]).map((doc) => doc.fileName),
			['new-document-1.pdf', 'new-document-2.pdf']
		);
	});
});
