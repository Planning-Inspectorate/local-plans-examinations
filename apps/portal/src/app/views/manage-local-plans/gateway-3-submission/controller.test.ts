import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import {
	buildGetJourneyResponseFromCase,
	buildGateway3CheckAnswersList,
	buildGateway3Middleware,
	buildSubmittedGateway3View,
	buildGuardDeclarationPage,
	buildGetDeclarationPage,
	buildPostDeclarationPage,
	buildGetSubmissionCompletePage,
	buildValidateGateway3Submission,
	handleMulterFileSizeError,
	redirectAfterCaseQuestionEdit,
	redirectAfterCyaEdit,
	setAsEditingFromCya,
	setGateway3ViewData,
	setGateway3ViewLocals,
	syncGateway3UploadAnswer
} from './controller.ts';
import type { PortalService } from '#service';
import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { GATEWAY_3_DECISION_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';

function buildMockDocumentSets() {
	const folderNames = [
		'proposed-local-plan',
		'map-of-policies',
		'statement-of-compliance',
		'statement-of-soundness',
		'consultation-engagement-summary',
		'scoping-consultation-summary',
		'consultation-content-evidence-summary',
		'consultation-proposed-plan-summary',
		'practical-arrangements-statement',
		'copies-of-representations',
		'supplementary-plans-statement',
		'environmental-report',
		'statement-of-reasons-determination',
		'representations-progress-summary',
		'gateway-2-issues-summary',
		'changes-since-consultation-statement',
		'other-documents'
	];
	return folderNames.map((folderName) => ({ id: `ds-${folderName}`, folderName }));
}

function buildMockService(caseRecord: unknown) {
	return {
		db: {
			case: {
				findUnique: mock.fn(async () => caseRecord)
			},
			documentSet: {
				findMany: async () => buildMockDocumentSets()
			},
			document: {
				findMany: async () => []
			}
		}
	} as unknown as PortalService;
}

function buildDocumentVersion(overrides: Record<string, unknown> = {}) {
	return {
		version: 1,
		lastModified: null,
		sourceSystem: 'front-office',
		virusCheckStatus: 'not_scanned',
		originalFilename: 'submitted-document.pdf',
		fileName: 'submitted-document.pdf',
		owner: null,
		mime: 'application/pdf',
		size: 123,
		blobStorageContainer: 'documents',
		blobStoragePath: 'gateway-3/submitted-document.pdf',
		documentURI: 'https://example.com/submitted-document.pdf',
		dateCreated: new Date('2026-10-01T10:00:00.000Z'),
		isDeleted: false,
		...overrides
	};
}

function buildMockResponse() {
	const calls: { method: string; args: unknown[] }[] = [];
	const res = {
		status(code: number) {
			calls.push({ method: 'status', args: [code] });
			return res;
		},
		render(view: string, data: unknown) {
			calls.push({ method: 'render', args: [view, data] });
		},
		locals: {}
	} as unknown as Response;
	return { res, calls };
}

describe('setGateway3ViewLocals', () => {
	it('sets page title, heading, caption, back link, save link and status tag when case and plan reference exist', () => {
		const req = {
			currentCase: {
				planTitle: 'Test Local Plan',
				gateway3Info: { expectedDate: new Date('2026-06-12T00:00:00.000Z') }
			},
			params: { planReference: 'PLAN-003' }
		} as any;

		const locals: Record<string, unknown> = {};
		const res = { locals } as unknown as Response;

		setGateway3ViewLocals(req as unknown as Request, res);

		assert.strictEqual(locals.pageTitle, 'Gateway 3 submission');
		assert.strictEqual(locals.pageHeading, 'Gateway 3 submission');
		assert.strictEqual(locals.pageCaption, 'Test Local Plan');
		assert.strictEqual(locals.backLinkUrl, '/manage-local-plans/PLAN-003');
		assert.strictEqual(locals.saveAndComeBackUrl, '/manage-local-plans/PLAN-003');
		assert.strictEqual(locals.targetDate, '12 June 2026');
		assert.deepStrictEqual(locals.statusTag, { label: 'Ready to start', class: 'govuk-tag govuk-tag--green' });
	});

	it('does not set back link or save link when no plan reference', () => {
		const req = {
			currentCase: {
				planTitle: 'Test Local Plan'
			},
			params: {}
		} as any;

		const locals: Record<string, unknown> = {};
		const res = { locals } as unknown as Response;

		setGateway3ViewLocals(req as unknown as Request, res);

		assert.strictEqual(locals.pageTitle, 'Gateway 3 submission');
		assert.strictEqual(locals.backLinkUrl, undefined);
		assert.strictEqual(locals.saveAndComeBackUrl, undefined);
	});

	it('sets the Under review status tag when Gateway 3 has an actual date', () => {
		const req = {
			currentCase: {
				planTitle: 'Test Local Plan',
				gateway3Info: {
					expectedDate: new Date('2026-06-12T00:00:00.000Z'),
					actualDate: new Date('2026-10-01T12:00:00.000Z')
				}
			},
			params: { planReference: 'PLAN-003' }
		} as any;

		const locals: Record<string, unknown> = {};
		const res = { locals } as unknown as Response;

		setGateway3ViewLocals(req as unknown as Request, res);

		assert.deepStrictEqual(locals.statusTag, {
			label: 'Under review',
			class: 'govuk-tag govuk-tag--yellow'
		});
	});

	it('sets the Ready to start status tag when a Gateway 3 resubmission has been requested but not sent', () => {
		const req = {
			currentCase: {
				planTitle: 'Test Local Plan',
				gateway3Info: {
					expectedDate: new Date('2026-06-12T00:00:00.000Z'),
					actualDate: new Date('2026-10-01T12:00:00.000Z'),
					submissions: [
						{
							decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED,
							completionDate: new Date('2026-10-15T12:00:00.000Z')
						},
						{ decision: null, completionDate: null }
					]
				}
			},
			params: { planReference: 'PLAN-003' }
		} as any;

		const locals: Record<string, unknown> = {};
		const res = { locals } as unknown as Response;

		setGateway3ViewLocals(req as unknown as Request, res);

		assert.deepStrictEqual(locals.statusTag, {
			label: 'Ready to start',
			class: 'govuk-tag govuk-tag--green'
		});
	});

	it('does not set targetDate when case has no gateway3Info.expectedDate', () => {
		const req = {
			currentCase: {
				planTitle: 'Test Local Plan',
				gateway3Info: null
			},
			params: { planReference: 'PLAN-003' }
		} as any;

		const locals: Record<string, unknown> = {};
		const res = { locals } as unknown as Response;

		setGateway3ViewLocals(req as unknown as Request, res);

		assert.strictEqual(locals.targetDate, undefined);
	});
});

describe('buildGetJourneyResponseFromCase', () => {
	it('loads the case and calls next when a matching reference is found', async () => {
		const currentCase = { id: 'case-1', reference: 'PLAN-001', planTitle: 'Test' };
		const service = buildMockService(currentCase) as any;
		const handler = buildGetJourneyResponseFromCase(service);
		const req = { params: { planReference: 'PLAN-001' }, session: {} } as unknown as Request;
		const { res } = buildMockResponse();
		let called = false;
		const next = () => {
			called = true;
		};

		await handler(req, res, next as NextFunction);

		assert.strictEqual(called, true);
		assert.strictEqual((req as any).currentCase, currentCase);
		assert.ok(res.locals.journeyResponse);
		assert.deepStrictEqual(service.db.case.findUnique.mock.calls[0].arguments[0], {
			where: { reference: 'PLAN-001' },
			include: { gateway3Info: { include: { submissions: true } } }
		});
	});

	it('renders 404 when the plan reference is missing', async () => {
		const handler = buildGetJourneyResponseFromCase(buildMockService(null));
		const req = { params: {}, session: {} } as unknown as Request;
		const { res, calls } = buildMockResponse();

		await handler(req, res, () => {});

		assert.strictEqual(calls[0].method, 'status');
		assert.strictEqual(calls[0].args[0], 404);
		assert.strictEqual(calls[1].method, 'render');
		assert.strictEqual(calls[1].args[0], 'views/layouts/error');
	});

	it('renders 404 when no case matches the reference', async () => {
		const handler = buildGetJourneyResponseFromCase(buildMockService(null));
		const req = { params: { planReference: 'PLAN-UNKNOWN' }, session: {} } as unknown as Request;
		const { res, calls } = buildMockResponse();

		await handler(req, res, () => {});

		assert.strictEqual(calls[0].method, 'status');
		assert.strictEqual(calls[0].args[0], 404);
		assert.strictEqual(calls[1].method, 'render');
		assert.strictEqual(calls[1].args[0], 'views/layouts/error');
	});
});

describe('setGateway3ViewData', () => {
	it('sets view locals and calls next', () => {
		const req = { currentCase: { planTitle: 'Test Plan' }, params: {} } as unknown as Request;
		const res = { locals: {} } as unknown as Response;
		let called = false;
		const next = () => {
			called = true;
		};

		setGateway3ViewData(req, res, next as NextFunction);

		assert.strictEqual(res.locals.pageTitle, 'Gateway 3 submission');
		assert.strictEqual(called, true);
	});
});

describe('buildSubmittedGateway3View', () => {
	it('sets the submitted template and locals when Gateway 3 has an actual date', () => {
		const middleware = buildSubmittedGateway3View();
		const actualDate = new Date('2026-10-01T12:30:00.000Z');
		const req = {
			currentCase: {
				email: 'user@example.com',
				gateway3Info: { actualDate }
			}
		} as any;
		const locals: Record<string, unknown> = {
			journey: { taskListTemplate: 'original-template.njk' },
			saveAndComeBackUrl: '/manage-local-plans/PLAN-001'
		};
		const res = { locals } as any;
		let nextCalled = false;

		middleware(req, res, () => {
			nextCalled = true;
		});

		assert.ok(nextCalled, 'expected next() to be called');
		assert.strictEqual(
			(locals.journey as { taskListTemplate: string }).taskListTemplate,
			'views/manage-local-plans/gateway-3-submission/check-your-answers-submitted.njk'
		);
		assert.ok(locals.submissionDate, 'expected submissionDate to be set');
		assert.ok(locals.submissionTime, 'expected submissionTime to be set');
		assert.strictEqual(locals.submitter, 'user@example.com');
		assert.strictEqual(locals.saveAndComeBackUrl, undefined, 'expected saveAndComeBackUrl to be removed');
	});

	it('calls next without changes when Gateway 3 has no actual date', () => {
		const middleware = buildSubmittedGateway3View();
		const req = {
			currentCase: {
				email: 'user@example.com',
				gateway3Info: { actualDate: null }
			}
		} as any;
		const locals: Record<string, unknown> = {
			journey: { taskListTemplate: 'original-template.njk' },
			saveAndComeBackUrl: '/manage-local-plans/PLAN-001'
		};
		const res = { locals } as any;
		let nextCalled = false;

		middleware(req, res, () => {
			nextCalled = true;
		});

		assert.ok(nextCalled, 'expected next() to be called');
		assert.strictEqual((locals.journey as { taskListTemplate: string }).taskListTemplate, 'original-template.njk');
		assert.strictEqual(locals.saveAndComeBackUrl, '/manage-local-plans/PLAN-001');
		assert.strictEqual(locals.submissionDate, undefined);
	});

	it('calls next without showing the submitted view when a Gateway 3 resubmission has been requested but not sent', () => {
		const middleware = buildSubmittedGateway3View();
		const req = {
			currentCase: {
				email: 'user@example.com',
				gateway3Info: {
					actualDate: new Date('2026-10-01T12:00:00.000Z'),
					submissions: [
						{
							decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED,
							completionDate: new Date('2026-10-15T12:00:00.000Z')
						},
						{ decision: null, completionDate: null }
					]
				}
			}
		} as any;
		const locals: Record<string, unknown> = {
			journey: { taskListTemplate: 'original-template.njk' },
			saveAndComeBackUrl: '/manage-local-plans/PLAN-001'
		};
		const res = { locals } as any;
		let nextCalled = false;

		middleware(req, res, () => {
			nextCalled = true;
		});

		assert.ok(nextCalled, 'expected next() to be called');
		assert.strictEqual((locals.journey as { taskListTemplate: string }).taskListTemplate, 'original-template.njk');
		assert.strictEqual(locals.saveAndComeBackUrl, '/manage-local-plans/PLAN-001');
		assert.strictEqual(locals.submissionDate, undefined);
	});

	it('sets the submitted template when a requested Gateway 3 resubmission has been sent', () => {
		const middleware = buildSubmittedGateway3View();
		const req = {
			currentCase: {
				email: 'user@example.com',
				gateway3Info: {
					actualDate: new Date('2026-10-20T12:00:00.000Z'),
					submissions: [
						{
							decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED,
							completionDate: new Date('2026-10-15T12:00:00.000Z')
						},
						{ decision: null, completionDate: null }
					]
				}
			}
		} as any;
		const locals: Record<string, unknown> = {
			journey: { taskListTemplate: 'original-template.njk' },
			saveAndComeBackUrl: '/manage-local-plans/PLAN-001'
		};
		const res = { locals } as any;

		middleware(req, res, () => {});

		assert.strictEqual(
			(locals.journey as { taskListTemplate: string }).taskListTemplate,
			'views/manage-local-plans/gateway-3-submission/check-your-answers-submitted.njk'
		);
		assert.ok(locals.submissionDate, 'expected submissionDate to be set');
		assert.strictEqual(locals.saveAndComeBackUrl, undefined, 'expected saveAndComeBackUrl to be removed');
	});
});

describe('buildGateway3CheckAnswersList', () => {
	it('returns a request handler', () => {
		const handler = buildGateway3CheckAnswersList();
		assert.strictEqual(typeof handler, 'function');
	});
});

describe('buildValidateGateway3Submission', () => {
	it('calls next when all required answers are present', () => {
		const handler = buildValidateGateway3Submission();
		const req = { params: { planReference: 'PLAN-001' } } as unknown as Request;
		const res = {
			locals: {
				journeyResponse: {
					answers: {
						examinationWebsite: 'https://example.com',
						proposedLocalPlan: [{ fileName: 'plan.pdf' }],
						mapOfPolicies: [{ fileName: 'map.pdf' }],
						statementOfCompliance: [{ fileName: 'compliance.pdf' }],
						statementOfSoundness: [{ fileName: 'soundness.pdf' }],
						consultationEngagementSummary: [{ fileName: 'engage.pdf' }],
						scopingConsultationSummary: [{ fileName: 'scoping.pdf' }],
						consultationContentEvidenceSummary: [{ fileName: 'content.pdf' }],
						consultationProposedPlanSummary: [{ fileName: 'consultation.pdf' }],
						practicalArrangementsStatement: [{ fileName: 'practical.pdf' }]
					}
				}
			}
		} as unknown as Response;
		let called = false;
		const next = () => {
			called = true;
		};

		handler(req, res, next as NextFunction);

		assert.strictEqual(called, true);
	});

	it('renders the check your answers page with an error when required answers are missing', async () => {
		const handler = buildValidateGateway3Submission();
		const req = { params: { planReference: 'PLAN-001' }, session: {} } as unknown as Request;
		let statusCode: number | undefined;
		const res = {
			status(code: number) {
				statusCode = code;
				return res;
			},
			render: () => {},
			locals: {
				journey: {
					sections: [
						{
							name: 'Required Information',
							segment: 'required-information',
							getStatus: () => 'in-progress',
							questions: []
						}
					],
					isComplete: () => false,
					taskListTemplate: 'views/layouts/main.njk',
					journeyTitle: 'Gateway 3 submission'
				},
				journeyResponse: { answers: {} }
			}
		} as unknown as Response;
		const next = () => {};

		await handler(req, res, next as NextFunction);

		assert.strictEqual(statusCode, 400);
		assert.strictEqual(res.locals.errors?.submit?.text, 'Add all required documents before submitting');
		assert.deepStrictEqual(res.locals.errorSummary, [
			{ text: 'Add all required documents before submitting', href: '#required-information' }
		]);
	});
});

describe('syncGateway3UploadAnswer', () => {
	it('sets the upload answer into the session forms for a case-scoped request', () => {
		const session: Record<string, unknown> = { forms: {} };
		const req = {
			params: { planReference: 'PLAN-001' },
			session
		} as unknown as Request;

		const uploadedFiles = [{ id: 'file-1', fileName: 'test.pdf' }] as any[];
		syncGateway3UploadAnswer(req, 'proposedLocalPlan', uploadedFiles);

		const forms = session.forms as Record<string, any>;
		assert.deepStrictEqual(forms['PLAN-001']['gateway-3-submission']['proposedLocalPlan'], uploadedFiles);
	});

	it('deletes the answer when uploaded files is empty', () => {
		const session: Record<string, unknown> = {
			forms: {
				'PLAN-001': {
					'gateway-3-submission': {
						proposedLocalPlan: [{ id: 'file-1' }]
					}
				}
			}
		};
		const req = {
			params: { planReference: 'PLAN-001' },
			session
		} as unknown as Request;

		syncGateway3UploadAnswer(req, 'proposedLocalPlan', []);

		const forms = session.forms as Record<string, any>;
		assert.strictEqual(forms['PLAN-001']['gateway-3-submission']['proposedLocalPlan'], undefined);
	});

	it('does nothing when session is missing', () => {
		const req = { params: {} } as unknown as Request;
		assert.doesNotThrow(() => syncGateway3UploadAnswer(req, 'proposedLocalPlan', []));
	});
});

describe('handleMulterFileSizeError', () => {
	it('redirects with error when multer file size limit is exceeded', () => {
		const err = new multer.MulterError('LIMIT_FILE_SIZE');
		const req = {
			params: { planReference: 'PLAN-001', section: 'required-information', question: 'proposed-local-plan' },
			baseUrl: '/manage-local-plans',
			session: {}
		} as unknown as Request;
		let redirectUrl = '';
		const res = { redirect: (url: string) => (redirectUrl = url) } as unknown as Response;
		const next = mock.fn();

		handleMulterFileSizeError(err, req, res, next);

		assert.ok(redirectUrl.includes('gateway-3-submission'));
		assert.strictEqual(next.mock.callCount(), 0);
		const session = req.session as any;
		assert.ok(session.errorSummary);
		assert.ok(session.errorSummary[0].text.includes('smaller than'));
	});

	it('calls next for non-multer errors', () => {
		const err = new Error('something else');
		const req = { params: {}, session: {} } as unknown as Request;
		const res = {} as unknown as Response;
		const next = mock.fn();

		handleMulterFileSizeError(err, req, res, next);

		assert.strictEqual(next.mock.callCount(), 1);
		assert.strictEqual(next.mock.calls[0].arguments[0], err);
	});
});

describe('setAsEditingFromCya', () => {
	it('sets editingFromCheckAnswers flag on session and calls next', () => {
		const session: Record<string, unknown> = {};
		const req = { session } as unknown as Request;
		const res = {} as unknown as Response;
		const next = mock.fn();

		setAsEditingFromCya(req, res, next);

		assert.strictEqual(session.editingFromCheckAnswers, true);
		assert.strictEqual(next.mock.callCount(), 1);
	});
});

describe('redirectAfterCyaEdit', () => {
	it('is an express middleware function', () => {
		assert.strictEqual(typeof redirectAfterCyaEdit, 'function');
		assert.strictEqual(redirectAfterCyaEdit.length, 3);
	});
});

describe('redirectAfterCaseQuestionEdit', () => {
	it('returns a middleware function when given a save function', () => {
		const saveDataFn = async () => {};
		const middleware = redirectAfterCaseQuestionEdit(saveDataFn);
		assert.strictEqual(typeof middleware, 'function');
	});
});

describe('buildGuardDeclarationPage', () => {
	const allRequiredAnswers = {
		examinationWebsite: 'https://example.com',
		proposedLocalPlan: [{ fileName: 'plan.pdf' }],
		mapOfPolicies: [{ fileName: 'map.pdf' }],
		statementOfCompliance: [{ fileName: 'compliance.pdf' }],
		statementOfSoundness: [{ fileName: 'soundness.pdf' }],
		consultationEngagementSummary: [{ fileName: 'engage.pdf' }],
		scopingConsultationSummary: [{ fileName: 'scoping.pdf' }],
		consultationContentEvidenceSummary: [{ fileName: 'content.pdf' }],
		consultationProposedPlanSummary: [{ fileName: 'consultation.pdf' }],
		practicalArrangementsStatement: [{ fileName: 'practical.pdf' }]
	};

	it('calls next when all required answers are present', () => {
		const handler = buildGuardDeclarationPage();
		const req = { params: { planReference: 'PLAN-001' } } as unknown as Request;
		const res = {
			locals: { journeyResponse: { answers: allRequiredAnswers } },
			redirect: mock.fn()
		} as unknown as Response;
		let called = false;
		const next = () => {
			called = true;
		};

		handler(req, res, next as NextFunction);

		assert.strictEqual(called, true);
		assert.strictEqual((res.redirect as ReturnType<typeof mock.fn>).mock.callCount(), 0);
	});

	it('redirects to the submission page when required answers are missing', () => {
		const handler = buildGuardDeclarationPage();
		const req = { params: { planReference: 'PLAN-001' } } as unknown as Request;
		let redirectUrl = '';
		const res = {
			locals: { journeyResponse: { answers: {} } },
			redirect: (url: string) => {
				redirectUrl = url;
			}
		} as unknown as Response;
		let called = false;
		const next = () => {
			called = true;
		};

		handler(req, res, next as NextFunction);

		assert.strictEqual(called, false);
		assert.strictEqual(redirectUrl, '/manage-local-plans/PLAN-001/gateway-3-submission');
	});

	it('redirects to the submission page when journeyResponse is missing', () => {
		const handler = buildGuardDeclarationPage();
		const req = { params: { planReference: 'PLAN-001' } } as unknown as Request;
		let redirectUrl = '';
		const res = {
			locals: {},
			redirect: (url: string) => {
				redirectUrl = url;
			}
		} as unknown as Response;

		handler(req, res, (() => {}) as NextFunction);

		assert.strictEqual(redirectUrl, '/manage-local-plans/PLAN-001/gateway-3-submission');
	});
});

describe('buildGetDeclarationPage', () => {
	it('renders the declaration page with correct title and back link', () => {
		const handler = buildGetDeclarationPage();
		const req = { params: { planReference: 'PLAN-001' } } as unknown as Request;
		const { res, calls } = buildMockResponse();

		handler(req, res, () => {});

		assert.strictEqual(calls[0].method, 'render');
		const [view, data] = calls[0].args as [string, Record<string, unknown>];
		assert.ok(view.includes('declaration/declaration.njk'));
		assert.strictEqual(data.pageTitle, "Are you sure you're ready to submit?");
		assert.strictEqual(data.pageHeading, "Are you sure you're ready to submit?");
		assert.strictEqual(data.backLinkUrl, '/manage-local-plans/PLAN-001/gateway-3-submission');
		assert.strictEqual(data.goBackUrl, '/manage-local-plans/PLAN-001/gateway-3-submission');
	});

	it('sets backLinkUrl and goBackUrl to undefined when no plan reference', () => {
		const handler = buildGetDeclarationPage();
		const req = { params: {} } as unknown as Request;
		const { res, calls } = buildMockResponse();

		handler(req, res, () => {});

		const [, data] = calls[0].args as [string, Record<string, unknown>];
		assert.strictEqual(data.backLinkUrl, undefined);
		assert.strictEqual(data.goBackUrl, undefined);
	});
});

describe('buildPostDeclarationPage', () => {
	it('mirrors submitted documents, updates submission dates and redirects to the submission-complete page', async () => {
		const caseUpdate = mock.fn(async () => ({}));
		const gateway3InfoUpdate = mock.fn(async () => ({}));
		const documentCreate = mock.fn(async () => ({}));
		const documentVersionCreate = mock.fn(async () => ({}));
		const documentUpdate = mock.fn(async () => ({}));
		const tx = {
			documentSet: {
				findMany: mock.fn(async () => buildMockDocumentSets()),
				findFirst: mock.fn(async () => ({ id: 'g3-document-1' }))
			},
			case: {
				findUnique: mock.fn(async () => ({
					id: 'case-1',
					gateway3Info: {
						id: 'gateway-3-info-1',
						submissions: [{ decision: null, completionDate: null }]
					},
					documents: [
						{
							guid: 'document-1',
							name: 'uploaded-document-1',
							documentSetId: 'ds-proposed-local-plan',
							latestDocumentVersion: buildDocumentVersion({ version: 1, originalFilename: 'plan.pdf' })
						},
						{
							guid: 'document-2',
							name: 'uploaded-document-2',
							documentSetId: 'ds-map-of-policies',
							latestDocumentVersion: buildDocumentVersion({ version: 3, originalFilename: 'map.pdf' })
						},
						{
							guid: 'document-3',
							name: 'uploaded-document-3',
							documentSetId: 'ds-statement-of-compliance',
							latestDocumentVersion: buildDocumentVersion({ version: 1, isDeleted: true })
						}
					]
				})),
				update: caseUpdate
			},
			document: {
				findMany: mock.fn(async () => []),
				create: documentCreate,
				update: documentUpdate
			},
			documentVersion: {
				create: documentVersionCreate
			},
			gateway3Info: {
				update: gateway3InfoUpdate
			}
		};
		const transaction = mock.fn(async (callback: (client: typeof tx) => unknown) => callback(tx));
		const service = {
			db: {
				$transaction: transaction,
				case: {},
				gateway3Info: {}
			},
			logger: {
				error: mock.fn()
			}
		} as unknown as PortalService;
		const handler = buildPostDeclarationPage(service);
		const req = {
			currentCase: { id: 'case-1' },
			params: { planReference: 'PLAN-001' }
		} as unknown as Request;
		let redirectUrl = '';
		const res = { redirect: (url: string) => (redirectUrl = url) } as unknown as Response;

		await handler(req, res, () => {});

		assert.strictEqual(transaction.mock.callCount(), 1);
		assert.strictEqual(tx.documentSet.findMany.mock.callCount(), 1);
		assert.strictEqual(tx.case.findUnique.mock.callCount(), 1);
		assert.deepStrictEqual(tx.case.findUnique.mock.calls[0].arguments[0].where, { id: 'case-1' });
		assert.strictEqual(tx.case.findUnique.mock.calls[0].arguments[0].select.documents.select.name, true);
		assert.strictEqual(tx.documentSet.findFirst.mock.callCount(), 1);
		assert.strictEqual(documentCreate.mock.callCount(), 2);
		assert.strictEqual(documentVersionCreate.mock.callCount(), 2);
		assert.strictEqual(documentUpdate.mock.callCount(), 2);
		assert.strictEqual(caseUpdate.mock.callCount(), 1);
		assert.strictEqual(gateway3InfoUpdate.mock.callCount(), 1);

		const caseUpdateArgs = caseUpdate.mock.calls[0].arguments[0];
		assert.deepStrictEqual(caseUpdateArgs.where, { id: 'case-1' });
		assert.ok(caseUpdateArgs.data.submissionDate instanceof Date);

		const gateway3InfoUpdateArgs = gateway3InfoUpdate.mock.calls[0].arguments[0];
		assert.deepStrictEqual(gateway3InfoUpdateArgs.where, { id: 'gateway-3-info-1' });
		assert.strictEqual(gateway3InfoUpdateArgs.data.actualDate, caseUpdateArgs.data.submissionDate);
		assert.deepStrictEqual(gateway3InfoUpdateArgs.data, { actualDate: caseUpdateArgs.data.submissionDate });

		assert.deepStrictEqual(tx.documentSet.findFirst.mock.calls[0].arguments[0], {
			where: { folderName: 'gateway-3-document-1' },
			select: { id: true }
		});
		const firstManageDocument = documentCreate.mock.calls[0].arguments[0].data;
		assert.strictEqual(firstManageDocument.name, 'document-1');
		assert.strictEqual(firstManageDocument.caseId, 'case-1');
		assert.strictEqual(firstManageDocument.documentSetId, 'g3-document-1');
		assert.strictEqual(firstManageDocument.createdAt, caseUpdateArgs.data.submissionDate);
		assert.ok(firstManageDocument.guid, 'expected a generated manage document guid');
		const secondManageDocument = documentCreate.mock.calls[1].arguments[0].data;
		assert.strictEqual(secondManageDocument.name, 'document-2');
		assert.strictEqual(secondManageDocument.documentSetId, 'g3-document-1');

		assert.deepStrictEqual(documentVersionCreate.mock.calls[0].arguments[0].data, {
			documentGuid: firstManageDocument.guid,
			version: 1,
			lastModified: null,
			sourceSystem: 'front-office',
			virusCheckStatus: 'not_scanned',
			originalFilename: 'plan.pdf',
			fileName: 'submitted-document.pdf',
			owner: null,
			mime: 'application/pdf',
			size: 123,
			blobStorageContainer: 'documents',
			blobStoragePath: 'gateway-3/submitted-document.pdf',
			documentURI: 'https://example.com/submitted-document.pdf',
			dateCreated: new Date('2026-10-01T10:00:00.000Z')
		});

		assert.strictEqual(redirectUrl, '/manage-local-plans/PLAN-001/gateway-3-submission/submission-complete');
	});

	it('uses the next numbered manage document set for a Gateway 3 resubmission', async () => {
		const caseUpdate = mock.fn(async () => ({}));
		const gateway3InfoUpdate = mock.fn(async () => ({}));
		const tx = buildPostDeclarationTransaction({
			caseUpdate,
			gateway3InfoUpdate,
			submissions: [
				{
					decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED,
					completionDate: new Date('2026-10-15T12:00:00.000Z')
				},
				{ decision: null, completionDate: null }
			]
		});
		const service = buildPostDeclarationService(tx);
		const handler = buildPostDeclarationPage(service);
		const req = {
			currentCase: { id: 'case-1' },
			params: { planReference: 'PLAN-001' }
		} as unknown as Request;
		const res = { redirect: () => {} } as unknown as Response;

		await handler(req, res, () => {});

		assert.deepStrictEqual(tx.documentSet.findFirst.mock.calls[0].arguments[0].where, {
			folderName: 'gateway-3-document-2'
		});
		assert.strictEqual(tx.document.create.mock.calls[0].arguments[0].data.name, 'document-1');
		assert.strictEqual(tx.document.create.mock.calls[0].arguments[0].data.documentSetId, 'g3-document-2');
		assert.deepStrictEqual(gateway3InfoUpdate.mock.calls[0].arguments[0].data, {
			actualDate: caseUpdate.mock.calls[0].arguments[0].data.submissionDate
		});
	});

	it('does not duplicate manage documents when the same final submission is repeated', async () => {
		const tx = buildPostDeclarationTransaction({
			existingManageDocuments: [{ name: 'document-1' }]
		});
		const service = buildPostDeclarationService(tx);
		const handler = buildPostDeclarationPage(service);
		const req = {
			currentCase: { id: 'case-1' },
			params: { planReference: 'PLAN-001' }
		} as unknown as Request;
		const res = { redirect: () => {} } as unknown as Response;

		await handler(req, res, () => {});

		assert.strictEqual(tx.document.create.mock.callCount(), 0);
		assert.strictEqual(tx.documentVersion.create.mock.callCount(), 0);
		assert.strictEqual(tx.document.update.mock.callCount(), 0);
	});

	it('does not mirror previously snapshotted Gateway 3 submission documents', async () => {
		const tx = buildPostDeclarationTransaction({
			submissions: [
				{
					decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED,
					completionDate: new Date('2026-10-15T12:00:00.000Z')
				},
				{ decision: null, completionDate: null }
			],
			documents: [
				{
					guid: 'document-1',
					name: 'uploaded-document-1',
					documentSetId: 'ds-proposed-local-plan',
					latestDocumentVersion: buildDocumentVersion({ version: 1 })
				},
				{
					guid: 'submitted-document-1',
					name: 'gateway-3-submission-1:document-1',
					documentSetId: 'ds-proposed-local-plan',
					latestDocumentVersion: buildDocumentVersion({ version: 1 })
				}
			]
		});
		const service = buildPostDeclarationService(tx);
		const handler = buildPostDeclarationPage(service);
		const req = buildPostDeclarationRequest();
		const res = { redirect: () => {} } as unknown as Response;

		await handler(req, res, () => {});

		assert.strictEqual(tx.document.create.mock.callCount(), 1);
		assert.strictEqual(tx.document.create.mock.calls[0].arguments[0].data.name, 'document-1');
		assert.strictEqual(tx.document.create.mock.calls[0].arguments[0].data.documentSetId, 'g3-document-2');
	});

	it('returns 500 when no Gateway 3 info exists for the case', async () => {
		const loggerError = mock.fn();
		const tx = buildPostDeclarationTransaction({
			gateway3Info: null
		});
		const service = buildPostDeclarationService(tx, loggerError);
		const handler = buildPostDeclarationPage(service);
		const req = buildPostDeclarationRequest();
		const { res, calls } = buildPostDeclarationFailureResponse();

		await handler(req, res, () => {});

		assertPostDeclarationFailure(calls);
		assert.strictEqual(tx.document.create.mock.callCount(), 0);
		assert.strictEqual(tx.case.update.mock.callCount(), 0);
		assert.strictEqual(tx.gateway3Info.update.mock.callCount(), 0);
		assert.strictEqual(loggerError.mock.callCount(), 1);
		assert.match(getLoggedErrorMessage(loggerError), /No Gateway 3 info found for case case-1/);
	});

	it('returns 500 when no active Gateway 3 documents exist for the case', async () => {
		const loggerError = mock.fn();
		const tx = buildPostDeclarationTransaction({
			documents: []
		});
		const service = buildPostDeclarationService(tx, loggerError);
		const handler = buildPostDeclarationPage(service);
		const req = buildPostDeclarationRequest();
		const { res, calls } = buildPostDeclarationFailureResponse();

		await handler(req, res, () => {});

		assertPostDeclarationFailure(calls);
		assert.strictEqual(tx.document.create.mock.callCount(), 0);
		assert.strictEqual(tx.case.update.mock.callCount(), 0);
		assert.strictEqual(tx.gateway3Info.update.mock.callCount(), 0);
		assert.strictEqual(loggerError.mock.callCount(), 1);
		assert.match(getLoggedErrorMessage(loggerError), /No active Gateway 3 documents found for case case-1/);
	});

	it('returns 500 when recording the Gateway 3 submission transaction fails', async () => {
		const transactionError = new Error('transaction failed');
		const loggerError = mock.fn();
		const transaction = mock.fn(async () => {
			throw transactionError;
		});
		const service = {
			db: {
				$transaction: transaction
			},
			logger: {
				error: loggerError
			}
		} as unknown as PortalService;
		const handler = buildPostDeclarationPage(service);
		const req = buildPostDeclarationRequest();
		const { res, calls } = buildPostDeclarationFailureResponse();

		await handler(req, res, () => {});

		assertPostDeclarationFailure(calls);
		assert.strictEqual(transaction.mock.callCount(), 1);
		assert.strictEqual(loggerError.mock.callCount(), 1);
		assert.strictEqual((loggerError.mock.calls[0].arguments[0] as { error: Error }).error, transactionError);
		assert.match(
			String(loggerError.mock.calls[0].arguments[1]),
			/Failed to update Gateway 3 submission date for case PLAN-001/
		);
	});
});

function buildPostDeclarationTransaction({
	caseUpdate = mock.fn(async () => ({})),
	gateway3InfoUpdate = mock.fn(async () => ({})),
	submissions = [{ decision: null, completionDate: null }],
	existingManageDocuments = [],
	gateway3Info,
	documents
}: {
	caseUpdate?: ReturnType<typeof mock.fn>;
	gateway3InfoUpdate?: ReturnType<typeof mock.fn>;
	submissions?: Array<{ decision: string | null; completionDate: Date | null }>;
	existingManageDocuments?: Array<{ name: string }>;
	gateway3Info?: {
		id: string;
		submissions?: Array<{ decision: string | null; completionDate: Date | null }> | null;
	} | null;
	documents?: Array<{
		guid: string;
		name: string;
		documentSetId: string;
		latestDocumentVersion: ReturnType<typeof buildDocumentVersion> | null;
	}>;
} = {}) {
	const gateway3InfoForCase =
		gateway3Info === undefined
			? {
					id: 'gateway-3-info-1',
					submissions
				}
			: gateway3Info;
	const documentsForCase = documents ?? [
		{
			guid: 'document-1',
			name: 'uploaded-document-1',
			documentSetId: 'ds-proposed-local-plan',
			latestDocumentVersion: buildDocumentVersion({ version: 1 })
		}
	];

	return {
		documentSet: {
			findMany: mock.fn(async () => buildMockDocumentSets()),
			findFirst: mock.fn(async ({ where }: { where: { folderName: string } }) => ({
				id: where.folderName.replace('gateway-3-document-', 'g3-document-')
			}))
		},
		case: {
			findUnique: mock.fn(async () => ({
				id: 'case-1',
				gateway3Info: gateway3InfoForCase,
				documents: documentsForCase
			})),
			update: caseUpdate
		},
		document: {
			findMany: mock.fn(async () => existingManageDocuments),
			create: mock.fn(async () => ({})),
			update: mock.fn(async () => ({}))
		},
		documentVersion: {
			create: mock.fn(async () => ({}))
		},
		gateway3Info: {
			update: gateway3InfoUpdate
		}
	};
}

function buildPostDeclarationService(tx: ReturnType<typeof buildPostDeclarationTransaction>, loggerError = mock.fn()) {
	return {
		db: {
			$transaction: mock.fn(async (callback: (client: typeof tx) => unknown) => callback(tx))
		},
		logger: {
			error: loggerError
		}
	} as unknown as PortalService;
}

function buildPostDeclarationRequest() {
	return {
		currentCase: { id: 'case-1' },
		params: { planReference: 'PLAN-001' }
	} as unknown as Request;
}

function buildPostDeclarationFailureResponse() {
	const calls: { method: string; args: unknown[] }[] = [];
	const res = {
		status(code: number) {
			calls.push({ method: 'status', args: [code] });
			return res;
		},
		send(body: string) {
			calls.push({ method: 'send', args: [body] });
			return res;
		},
		redirect(url: string) {
			calls.push({ method: 'redirect', args: [url] });
			return res;
		}
	} as unknown as Response;
	return { res, calls };
}

function assertPostDeclarationFailure(calls: { method: string; args: unknown[] }[]) {
	assert.deepStrictEqual(calls, [
		{ method: 'status', args: [500] },
		{ method: 'send', args: ['Failed to record submission'] }
	]);
}

function getLoggedErrorMessage(loggerError: ReturnType<typeof mock.fn>) {
	return (loggerError.mock.calls[0].arguments[0] as { error?: Error }).error?.message ?? '';
}

describe('buildGetSubmissionCompletePage', () => {
	it('renders the submission complete page with plan overview link', () => {
		const handler = buildGetSubmissionCompletePage();
		const req = { params: { planReference: 'PLAN-001' } } as unknown as Request;
		const { res, calls } = buildMockResponse();

		handler(req, res, () => {});

		assert.strictEqual(calls[0].method, 'render');
		const [view, data] = calls[0].args as [string, Record<string, unknown>];
		assert.ok(view.includes('submission-complete.njk'));
		assert.strictEqual(data.pageTitle, 'Gateway 3 submission complete');
		assert.strictEqual(data.pageHeading, 'Gateway 3 submission complete');
		assert.strictEqual(data.planOverviewUrl, '/manage-local-plans/PLAN-001');
	});

	it('falls back to /manage-local-plans when no plan reference', () => {
		const handler = buildGetSubmissionCompletePage();
		const req = { params: {} } as unknown as Request;
		const { res, calls } = buildMockResponse();

		handler(req, res, () => {});

		const [, data] = calls[0].args as [string, Record<string, unknown>];
		assert.strictEqual(data.planOverviewUrl, '/manage-local-plans');
	});
});

describe('buildGateway3Middleware', () => {
	it('returns all expected middleware handlers', () => {
		const mockService = {
			db: {
				case: { findUnique: async () => null },
				documentSet: { findMany: async () => [] },
				document: { findMany: async () => [] }
			},
			logger: {
				info: () => {},
				warn: () => {},
				error: () => {}
			},
			createFileStorage: () => ({
				upload: async () => ({ id: 'file-1' }),
				delete: async () => {},
				list: async () => []
			})
		} as unknown as PortalService;

		const middleware = buildGateway3Middleware(mockService);

		assert.strictEqual(typeof middleware.getJourneyResponse, 'function');
		assert.strictEqual(typeof middleware.getJourney, 'function');
		assert.strictEqual(typeof middleware.getJourneyResponseFromCase, 'function');
		assert.strictEqual(typeof middleware.saveDataToCase, 'function');
		assert.ok(middleware.upload);
		assert.strictEqual(typeof middleware.uploadGateway3DocumentForCase, 'function');
		assert.strictEqual(typeof middleware.deleteGateway3DocumentForCase, 'function');
		assert.strictEqual(typeof middleware.fileUploaderMiddlewareForCase, 'function');
		assert.strictEqual(typeof middleware.downloadGateway3Document, 'function');
		assert.strictEqual(typeof middleware.validate, 'function');
		assert.strictEqual(typeof middleware.validationErrorHandler, 'function');
		assert.strictEqual(typeof middleware.question, 'function');
		assert.strictEqual(typeof middleware.redirectAfterCaseQuestionEdit, 'function');
		assert.strictEqual(typeof middleware.guardDeclarationPage, 'function');
		assert.strictEqual(typeof middleware.postDeclarationPage, 'function');
		assert.strictEqual(typeof middleware.getSubmissionCompletePage, 'function');
	});

	it('uploadGateway3DocumentForCase returns 404 for unknown question URL', () => {
		const mockService = {
			db: {
				case: { findUnique: async () => null },
				documentSet: { findMany: async () => [] },
				document: { findMany: async () => [] }
			},
			logger: { info: () => {}, warn: () => {}, error: () => {} },
			createFileStorage: () => ({})
		} as unknown as PortalService;

		const middleware = buildGateway3Middleware(mockService);
		const req = { params: { question: 'unknown-question' } } as unknown as Request;
		const { res, calls } = buildMockResponse();

		middleware.uploadGateway3DocumentForCase(req, res, () => {});

		assert.strictEqual(calls[0]?.method, 'status');
		assert.strictEqual(calls[0]?.args[0], 404);
	});

	it('deleteGateway3DocumentForCase returns 404 for unknown question URL', () => {
		const mockService = {
			db: {
				case: { findUnique: async () => null },
				documentSet: { findMany: async () => [] },
				document: { findMany: async () => [] }
			},
			logger: { info: () => {}, warn: () => {}, error: () => {} },
			createFileStorage: () => ({})
		} as unknown as PortalService;

		const middleware = buildGateway3Middleware(mockService);
		const req = { params: { question: 'nonexistent' } } as unknown as Request;
		const { res, calls } = buildMockResponse();

		middleware.deleteGateway3DocumentForCase(req, res, () => {});

		assert.strictEqual(calls[0]?.method, 'status');
		assert.strictEqual(calls[0]?.args[0], 404);
	});
});
