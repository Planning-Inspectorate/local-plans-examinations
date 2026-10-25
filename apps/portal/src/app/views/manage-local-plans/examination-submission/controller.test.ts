import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import type { PortalService } from '#service';
import { DocumentUtil } from '@pins/local-plans-lib/util/documents.ts';
import { EXAMINATION_STATUS_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';
import {
	buildExaminationCheckAnswersList,
	buildExaminationMiddleware,
	buildGetDeclarationPage,
	buildGetJourneyResponseFromCase,
	buildGetSubmissionCompletePage,
	buildGuardDeclarationPage,
	buildGuardExaminationAvailable,
	buildGuardExaminationEdit,
	buildPostDeclarationPage,
	buildSaveDataToCase,
	buildSubmittedExaminationView,
	buildValidateExaminationSubmission,
	handleMulterFileSizeError,
	markExaminationInProgress,
	setAsEditingFromCheckAnswers,
	setExaminationViewData,
	setExaminationViewLocals
} from './controller.ts';
import { createJourney, JOURNEY_ID } from './journey.ts';
import {
	createExaminationQuestions,
	EXAMINATION_FILE_UPLOAD_QUESTIONS,
	EXAMINATION_REQUIRED_FILE_UPLOAD_QUESTIONS
} from './questions.ts';

const documentSets = Object.values(EXAMINATION_FILE_UPLOAD_QUESTIONS).map((question, index) => ({
	id: `document-set-${index}`,
	folderName: question.documentSetFolderName
}));

function buildService(caseRecord: unknown) {
	return {
		db: {
			case: { findUnique: mock.fn(async () => caseRecord) },
			examinationInfo: {
				update: mock.fn(async () => ({})),
				upsert: mock.fn(async () => ({}))
			},
			documentSet: { findMany: mock.fn(async () => documentSets) },
			document: { findMany: mock.fn(async () => []) }
		},
		logger: { error: mock.fn() }
	} as unknown as PortalService;
}

function buildJourneyContext(answers: Record<string, unknown> = {}) {
	const req = {
		baseUrl: '/manage-local-plans',
		params: { planReference: 'PLAN-61797' },
		session: {}
	} as unknown as Request;
	const journeyResponse = new JourneyResponse(JOURNEY_ID, 'case-id', answers);
	const journey = createJourney(req, journeyResponse, createExaminationQuestions('PLAN-61797'));
	const res = {
		locals: { journey, journeyResponse }
	} as unknown as Response;
	return { req, res };
}

describe('examination view data', () => {
	it('shows a status tag unless the status is Cannot start yet', () => {
		const locals: Record<string, unknown> = {};
		setExaminationViewLocals(
			{
				params: { planReference: 'PLAN-61797' },
				currentCase: {
					planTitle: 'Test plan',
					examinationInfo: {
						status: 'ready-to-start',
						expectedSubmissionForExaminationDate: new Date('2026-09-01T12:00:00.000Z'),
						statusLookup: { displayName: 'Ready to start' }
					}
				}
			} as unknown as Request,
			{ locals } as unknown as Response
		);

		assert.deepEqual(locals.statusTag, {
			label: 'Ready to start',
			class: 'govuk-tag govuk-tag--green'
		});
		assert.equal(locals.targetDate, '1 September 2026');

		const hiddenStatusLocals: Record<string, unknown> = {};
		setExaminationViewLocals(
			{
				params: { planReference: 'PLAN-61797' },
				currentCase: {
					examinationInfo: {
						status: 'cannot-start-yet',
						statusLookup: { displayName: 'Cannot start yet' }
					}
				}
			} as unknown as Request,
			{ locals: hiddenStatusLocals } as unknown as Response
		);
		assert.equal(hiddenStatusLocals.statusTag, undefined);

		const fallbackStatusLocals: Record<string, unknown> = {};
		setExaminationViewLocals(
			{
				params: { planReference: ['PLAN-61797'] },
				currentCase: {
					examinationInfo: {
						status: 'future-status',
						statusLookup: null
					}
				}
			} as unknown as Request,
			{ locals: fallbackStatusLocals } as unknown as Response
		);
		assert.deepEqual(fallbackStatusLocals.statusTag, {
			label: 'future-status',
			class: 'govuk-tag govuk-tag--blue'
		});
		assert.equal(fallbackStatusLocals.backLinkUrl, '/manage-local-plans/PLAN-61797');
	});

	it('sets view data and marks the session as editing from check answers', () => {
		const req = {
			params: { planReference: 'PLAN-61797' },
			session: {},
			currentCase: { planTitle: 'Test plan' }
		} as unknown as Request;
		const res = { locals: {} } as unknown as Response;
		const next = mock.fn();

		setAsEditingFromCheckAnswers(req, res, next as unknown as NextFunction);
		setExaminationViewData(req, res, next as unknown as NextFunction);

		assert.equal((req.session as any).editingFromCheckAnswers, true);
		assert.equal(res.locals.pageTitle, 'Examination');
		assert.equal(res.locals.pageHeading, 'Examination');
		assert.equal(res.locals.pageCaption, 'Test plan');
		assert.equal(res.locals.backLinkUrl, '/manage-local-plans/PLAN-61797');
		assert.equal(next.mock.callCount(), 2);
	});

	it('uses the submitted and in-examination status tags', () => {
		for (const { status, label, className } of [
			{
				status: EXAMINATION_STATUS_ID.SUBMITTED,
				label: 'Submitted',
				className: 'govuk-tag govuk-tag--yellow'
			},
			{
				status: EXAMINATION_STATUS_ID.IN_EXAMINATION,
				label: 'In examination',
				className: 'govuk-tag govuk-tag--blue'
			}
		]) {
			const locals: Record<string, unknown> = {};

			setExaminationViewLocals(
				{
					params: { planReference: 'PLAN-61797' },
					currentCase: {
						examinationInfo: {
							status,
							statusLookup: { displayName: label }
						}
					}
				} as unknown as Request,
				{ locals } as unknown as Response
			);

			assert.deepEqual(locals.statusTag, { label, class: className });
		}
	});
});

describe('buildGetJourneyResponseFromCase', () => {
	it('copies and prepopulates the website from Gateway 3 and loads persisted examination documents', async () => {
		const currentCase = {
			id: 'case-id',
			reference: 'PLAN-61797',
			planTitle: 'Test plan',
			examinationInfo: {
				status: 'ready-to-start',
				examinationWebsite: null,
				examinationWebsiteUrl: null,
				statusLookup: { displayName: 'Ready to start' }
			},
			gateway3Info: {
				examinationWebsiteUrl: 'https://gateway-3.example.com'
			}
		};
		const service = buildService(currentCase);
		const handler = buildGetJourneyResponseFromCase(service);
		const req = { params: { planReference: 'PLAN-61797' }, session: {} } as unknown as Request;
		const res = { locals: {} } as unknown as Response;
		let nextCalled = false;

		await handler(req, res, (() => {
			nextCalled = true;
		}) as NextFunction);

		assert.equal(nextCalled, true);
		const response = res.locals.journeyResponse as JourneyResponse;
		assert.equal(response.answers.examinationWebsiteUrl, 'https://gateway-3.example.com');
		assert.deepEqual(service.db.examinationInfo.upsert.mock.calls[0].arguments[0], {
			where: { caseId: 'case-id' },
			create: {
				caseId: 'case-id',
				examinationWebsiteUrl: 'https://gateway-3.example.com'
			},
			update: {
				examinationWebsiteUrl: 'https://gateway-3.example.com'
			}
		});
		assert.equal(service.db.document.findMany.mock.callCount(), documentSets.length);
	});

	it('does not overwrite an existing examination website with the Gateway 3 website', async () => {
		const currentCase = {
			id: 'case-id',
			reference: 'PLAN-61797',
			planTitle: 'Test plan',
			examinationInfo: {
				status: 'in-progress',
				examinationWebsite: null,
				examinationWebsiteUrl: 'https://examination.example.com',
				statusLookup: { displayName: 'In progress' }
			},
			gateway3Info: {
				examinationWebsiteUrl: 'https://gateway-3.example.com'
			}
		};
		const service = buildService(currentCase);
		const handler = buildGetJourneyResponseFromCase(service);
		const req = { params: { planReference: 'PLAN-61797' }, session: {} } as unknown as Request;
		const res = { locals: {} } as unknown as Response;

		await handler(req, res, (() => {}) as NextFunction);

		const response = res.locals.journeyResponse as JourneyResponse;
		assert.equal(response.answers.examinationWebsiteUrl, 'https://examination.example.com');
		assert.equal(service.db.examinationInfo.upsert.mock.callCount(), 0);
	});

	it('renders not found when the route has no plan reference', async () => {
		const service = buildService(null);
		const handler = buildGetJourneyResponseFromCase(service);
		const req = { params: {}, session: {} } as unknown as Request;
		const res = {
			locals: {},
			status: mock.fn(() => res),
			render: mock.fn()
		} as unknown as Response;

		await handler(req, res, mock.fn() as unknown as NextFunction);

		assert.deepEqual((res.status as any).mock.calls[0].arguments, [404]);
		assert.equal((res.render as any).mock.calls[0].arguments[0], 'views/layouts/error');
		assert.equal(service.db.case.findUnique.mock.callCount(), 0);
	});

	it('renders not found when the case does not exist', async () => {
		const service = buildService(null);
		const handler = buildGetJourneyResponseFromCase(service);
		const req = { params: { planReference: 'PLAN-61797' }, session: {} } as unknown as Request;
		const res = {
			locals: {},
			status: mock.fn(() => res),
			render: mock.fn()
		} as unknown as Response;

		await handler(req, res, mock.fn() as unknown as NextFunction);

		assert.deepEqual((res.status as any).mock.calls[0].arguments, [404]);
		assert.equal((res.render as any).mock.calls[0].arguments[0], 'views/layouts/error');
	});
});

describe('examination status updates', () => {
	it('sets the examination status to In progress when a document changes', async () => {
		const service = buildService(null);

		await markExaminationInProgress(service, 'case-id');

		assert.deepEqual(service.db.examinationInfo.update.mock.calls[0].arguments[0], {
			where: { caseId: 'case-id' },
			data: { status: 'in-progress' }
		});
	});

	it('persists the confirmed examination website, sets In progress and keeps the session answer', async () => {
		const service = buildService(null);
		const save = buildSaveDataToCase(service);
		const req = {
			params: { planReference: 'PLAN-61797' },
			session: {}
		} as unknown as Request;

		await save({
			req,
			res: {} as Response,
			journeyId: JOURNEY_ID,
			referenceId: 'case-id',
			isManageListItem: false,
			data: { answers: { examinationWebsiteUrl: 'https://examination.example.com' } }
		});

		assert.deepEqual(service.db.examinationInfo.upsert.mock.calls[0].arguments[0], {
			where: { caseId: 'case-id' },
			create: {
				caseId: 'case-id',
				examinationWebsiteUrl: 'https://examination.example.com',
				status: 'in-progress'
			},
			update: {
				examinationWebsiteUrl: 'https://examination.example.com',
				status: 'in-progress'
			}
		});
		assert.equal(
			(req.session as any).forms['PLAN-61797'][JOURNEY_ID].examinationWebsiteUrl,
			'https://examination.example.com'
		);
	});

	it('does not persist an examination website when the answer is not a string', async () => {
		const service = buildService(null);
		const save = buildSaveDataToCase(service);
		const req = {
			params: { planReference: 'PLAN-61797' },
			session: {}
		} as unknown as Request;

		await save({
			req,
			res: {} as Response,
			journeyId: JOURNEY_ID,
			referenceId: 'case-id',
			isManageListItem: false,
			data: { answers: { examinationWebsiteUrl: null } }
		});

		assert.equal(service.db.examinationInfo.upsert.mock.callCount(), 0);
	});
});

describe('examination submission validation', () => {
	it('calls next when every required answer is present', async () => {
		const answers = Object.fromEntries(
			Object.values(EXAMINATION_REQUIRED_FILE_UPLOAD_QUESTIONS).map((question) => [
				question.fieldName,
				[{ fileName: `${question.fieldName}.pdf` }]
			])
		);
		answers.examinationWebsiteUrl = 'https://examination.example.com';
		const { req, res } = buildJourneyContext(answers);
		const next = mock.fn();

		await buildValidateExaminationSubmission()(req, res, next as unknown as NextFunction);

		assert.equal(next.mock.callCount(), 1);
	});

	it('renders the submission page with an error when a required answer is missing', async () => {
		const { req, res } = buildJourneyContext();
		(res as any).status = mock.fn(() => res);
		(res as any).render = mock.fn();

		await buildValidateExaminationSubmission()(req, res, mock.fn() as unknown as NextFunction);

		assert.deepEqual((res.status as any).mock.calls[0].arguments, [400]);
		assert.equal(res.locals.errors.submit.text, 'Add all required documents before you submit');
		assert.deepEqual(res.locals.errorSummary, [
			{ text: 'Add all required documents before you submit', href: '#examination-details' }
		]);
		assert.equal((res.render as any).mock.calls[0].arguments[0], 'components/task-list/index');
	});

	it('builds the examination check-answers list', async () => {
		const { req, res } = buildJourneyContext();
		(res as any).render = mock.fn();

		await buildExaminationCheckAnswersList()(req, res, mock.fn() as unknown as NextFunction);

		const [view, viewData] = (res.render as any).mock.calls[0].arguments;
		assert.equal(view, 'components/task-list/index');
		assert.equal(viewData.pageCaption, undefined);
		assert.deepEqual(viewData.requiredItemTitles, [
			'Examination website',
			'Local plan submission for examination',
			'Map of proposed local plan policies',
			'Gateway 3 completion statement',
			'Summary of consultation and engagement activities in preparing the proposed local plan',
			'Summary of consultation on proposed local plan',
			'Statement of compliance',
			'Statement of soundness'
		]);
	});
});

describe('examination route guards', () => {
	it('allows the examination page when examination is available', () => {
		const next = mock.fn();
		const req = {
			currentCase: { examinationInfo: { status: 'ready-to-start' } },
			params: { planReference: 'PLAN-61797' }
		} as unknown as Request;

		buildGuardExaminationAvailable()(req, {} as Response, next as unknown as NextFunction);

		assert.equal(next.mock.callCount(), 1);
	});

	it('redirects to plan details when examination cannot start yet', () => {
		const redirect = mock.fn();
		const req = {
			currentCase: { examinationInfo: { status: 'cannot-start-yet' } },
			params: { planReference: 'PLAN-61797' }
		} as unknown as Request;

		buildGuardExaminationAvailable()(req, { redirect } as unknown as Response, mock.fn() as unknown as NextFunction);

		assert.deepEqual(redirect.mock.calls[0].arguments, ['/manage-local-plans/PLAN-61797']);
	});

	it('allows editing while in progress and blocks editing after submission', () => {
		const guard = buildGuardExaminationEdit();
		const next = mock.fn();
		const editableRequest = {
			currentCase: { examinationInfo: { status: 'in-progress' } },
			params: { planReference: 'PLAN-61797' }
		} as unknown as Request;
		guard(editableRequest, {} as Response, next as unknown as NextFunction);
		assert.equal(next.mock.callCount(), 1);

		const redirect = mock.fn();
		const submittedRequest = {
			currentCase: { examinationInfo: { status: 'submitted' } },
			params: { planReference: 'PLAN-61797' }
		} as unknown as Request;
		guard(submittedRequest, { redirect } as unknown as Response, mock.fn() as unknown as NextFunction);
		assert.deepEqual(redirect.mock.calls[0].arguments, ['/manage-local-plans/PLAN-61797/examination']);
	});

	it('only allows the declaration page when all required answers are present', () => {
		const answers = Object.fromEntries(
			Object.values(EXAMINATION_REQUIRED_FILE_UPLOAD_QUESTIONS).map((question) => [question.fieldName, [{}]])
		);
		answers.examinationWebsiteUrl = 'https://examination.example.com';
		const next = mock.fn();
		const req = { params: { planReference: 'PLAN-61797' } } as unknown as Request;

		buildGuardDeclarationPage()(
			req,
			{ locals: { journeyResponse: { answers } } } as unknown as Response,
			next as unknown as NextFunction
		);
		assert.equal(next.mock.callCount(), 1);

		const redirect = mock.fn();
		buildGuardDeclarationPage()(
			req,
			{ locals: { journeyResponse: { answers: {} } }, redirect } as unknown as Response,
			mock.fn() as unknown as NextFunction
		);
		assert.deepEqual(redirect.mock.calls[0].arguments, ['/manage-local-plans/PLAN-61797/examination']);
	});
});

describe('examination declaration and completion', () => {
	it('renders the declaration with links back to the examination submission', () => {
		const render = mock.fn();
		buildGetDeclarationPage()(
			{ params: { planReference: 'PLAN 61797' } } as unknown as Request,
			{ render } as unknown as Response,
			mock.fn() as unknown as NextFunction
		);

		assert.deepEqual(render.mock.calls[0].arguments, [
			'views/manage-local-plans/examination-submission/declaration/declaration.njk',
			{
				pageTitle: "Are you sure you're ready to submit?",
				pageHeading: "Are you sure you're ready to submit?",
				backLinkUrl: '/manage-local-plans/PLAN%2061797/examination',
				goBackUrl: '/manage-local-plans/PLAN%2061797/examination'
			}
		]);
	});

	it('records the submitted status and date before redirecting to submission complete', async () => {
		const service = buildService(null);
		const redirect = mock.fn();
		const req = {
			currentCase: { id: 'case-id' },
			params: { planReference: 'PLAN-61797' }
		} as unknown as Request;

		await buildPostDeclarationPage(service)(
			req,
			{ redirect } as unknown as Response,
			mock.fn() as unknown as NextFunction
		);

		const update = service.db.examinationInfo.update.mock.calls[0].arguments[0];
		assert.deepEqual(update.where, { caseId: 'case-id' });
		assert.equal(update.data.status, 'submitted');
		assert.ok(update.data.submissionForExaminationDate instanceof Date);
		assert.deepEqual(redirect.mock.calls[0].arguments, [
			'/manage-local-plans/PLAN-61797/examination/submission-complete'
		]);
	});

	it('returns an error without changing status when the case is unavailable', async () => {
		const service = buildService(null);
		const send = mock.fn();
		const res = {
			status: mock.fn(() => res),
			send
		} as unknown as Response;

		await buildPostDeclarationPage(service)(
			{ currentCase: null, params: { planReference: 'PLAN-61797' } } as unknown as Request,
			res,
			mock.fn() as unknown as NextFunction
		);

		assert.deepEqual((res.status as any).mock.calls[0].arguments, [500]);
		assert.deepEqual(send.mock.calls[0].arguments, ['No case found']);
		assert.equal(service.db.examinationInfo.update.mock.callCount(), 0);
	});

	it('renders the completion page with a link to plan details', () => {
		const render = mock.fn();
		buildGetSubmissionCompletePage()(
			{ params: { planReference: 'PLAN-61797' } } as unknown as Request,
			{ render } as unknown as Response,
			mock.fn() as unknown as NextFunction
		);

		assert.deepEqual(render.mock.calls[0].arguments, [
			'views/manage-local-plans/examination-submission/declaration/submission-complete.njk',
			{
				pageTitle: 'Submission complete',
				pageHeading: 'Submission complete',
				planOverviewUrl: '/manage-local-plans/PLAN-61797'
			}
		]);
	});

	it('switches a submitted examination to the read-only view', () => {
		const next = mock.fn();
		const req = {
			currentCase: {
				email: 'planner@example.com',
				examinationInfo: {
					status: 'submitted',
					submissionForExaminationDate: new Date('2026-10-21T10:30:00Z')
				}
			}
		} as unknown as Request;
		const res = {
			locals: {
				journey: { taskListTemplate: 'editable.njk' },
				saveAndComeBackUrl: '/save'
			}
		} as unknown as Response;

		buildSubmittedExaminationView()(req, res, next as unknown as NextFunction);

		assert.equal(
			res.locals.journey.taskListTemplate,
			'views/manage-local-plans/examination-submission/check-your-answers-submitted.njk'
		);
		assert.equal(res.locals.submissionDate, '21 October 2026');
		assert.equal(res.locals.submitter, 'planner@example.com');
		assert.equal(res.locals.pageTitle, 'Examination submission');
		assert.equal(res.locals.pageHeading, 'Examination submission');
		assert.equal(res.locals.saveAndComeBackUrl, undefined);
		assert.equal(next.mock.callCount(), 1);
	});

	it('uses the read-only view while the examination is in progress with an inspector', () => {
		const next = mock.fn();
		const req = {
			currentCase: {
				email: 'planner@example.com',
				examinationInfo: {
					status: EXAMINATION_STATUS_ID.IN_EXAMINATION,
					submissionForExaminationDate: new Date('2026-10-21T10:30:00Z')
				}
			}
		} as unknown as Request;
		const res = {
			locals: {
				journey: { taskListTemplate: 'editable.njk' },
				saveAndComeBackUrl: '/save'
			}
		} as unknown as Response;

		buildSubmittedExaminationView()(req, res, next as unknown as NextFunction);

		assert.equal(
			res.locals.journey.taskListTemplate,
			'views/manage-local-plans/examination-submission/check-your-answers-submitted.njk'
		);
		assert.equal(res.locals.pageHeading, 'Examination submission');
		assert.equal(res.locals.submissionDate, '21 October 2026');
		assert.equal(res.locals.saveAndComeBackUrl, undefined);
		assert.equal(next.mock.callCount(), 1);
	});

	it('uses the read-only view for a submitted examination even when its submission date is unavailable', () => {
		const next = mock.fn();
		const req = {
			currentCase: {
				email: 'planner@example.com',
				examinationInfo: {
					status: EXAMINATION_STATUS_ID.SUBMITTED,
					submissionForExaminationDate: null
				}
			}
		} as unknown as Request;
		const res = {
			locals: {
				journey: { taskListTemplate: 'editable.njk' },
				saveAndComeBackUrl: '/save'
			}
		} as unknown as Response;

		buildSubmittedExaminationView()(req, res, next as unknown as NextFunction);

		assert.equal(
			res.locals.journey.taskListTemplate,
			'views/manage-local-plans/examination-submission/check-your-answers-submitted.njk'
		);
		assert.equal(res.locals.submissionDate, undefined);
		assert.equal(res.locals.submissionTime, undefined);
		assert.equal(res.locals.saveAndComeBackUrl, undefined);
		assert.equal(next.mock.callCount(), 1);
	});
});

describe('examination document handlers', () => {
	it('redirects with a session error when a file exceeds the size limit', () => {
		const err = new multer.MulterError('LIMIT_FILE_SIZE');
		const req = {
			baseUrl: '/manage-local-plans',
			params: {
				planReference: 'PLAN-61797',
				section: 'examination-details',
				question: 'local-plan-submission'
			},
			session: {}
		} as unknown as Request;
		const redirect = mock.fn();
		const next = mock.fn();

		handleMulterFileSizeError(err, req, { redirect } as unknown as Response, next as unknown as NextFunction);

		assert.equal(next.mock.callCount(), 0);
		assert.deepEqual(redirect.mock.calls[0].arguments, [
			'/manage-local-plans/PLAN-61797/examination/examination-details/local-plan-submission'
		]);
		assert.equal((req.session as any).errors['upload-form'].msg, 'Errors encountered during file upload');
		assert.equal((req.session as any).errorSummary[0].text, 'The selected file must be smaller than 250MB');
	});

	it('passes non-file-size errors to the next handler', () => {
		const err = new Error('upload failed');
		const next = mock.fn();

		handleMulterFileSizeError(
			err,
			{ params: {}, session: {} } as unknown as Request,
			{} as Response,
			next as unknown as NextFunction
		);

		assert.deepEqual(next.mock.calls[0].arguments, [err]);
	});

	it('renders not found when an unknown upload question is requested', () => {
		const service = buildService(null) as PortalService & { createFileStorage: () => object };
		service.createFileStorage = () => ({});
		const middleware = buildExaminationMiddleware(service);
		const req = {
			params: { question: 'unknown-question' },
			session: {}
		} as unknown as Request;
		const res = {
			status: mock.fn(() => res),
			render: mock.fn()
		} as unknown as Response;

		middleware.uploadDocumentForCase(req, res, mock.fn() as unknown as NextFunction);

		assert.deepEqual((res.status as any).mock.calls[0].arguments, [404]);
		assert.equal((res.render as any).mock.calls[0].arguments[0], 'views/layouts/error');
	});

	it('downloads a persisted examination document', async () => {
		const service = buildService(null) as PortalService & { createFileStorage: () => object };
		service.createFileStorage = () => ({});
		const download = mock.method(DocumentUtil, 'downloadDocumentToResponse', async () => {});
		const middleware = buildExaminationMiddleware(service);
		const req = { params: { documentId: 'document-guid' } } as unknown as Request;
		const res = {} as Response;

		await middleware.downloadDocument(req, res, mock.fn() as unknown as NextFunction);

		assert.deepEqual(download.mock.calls[0].arguments, [service, 'document-guid', res]);
		download.mock.restore();
	});
});
