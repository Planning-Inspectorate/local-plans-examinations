import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import type { NextFunction, Request, Response } from 'express';
import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import type { PortalService } from '#service';
import {
	buildGetJourneyResponseFromCase,
	buildSaveDataToCase,
	markExaminationInProgress,
	setExaminationViewLocals
} from './controller.ts';
import { JOURNEY_ID } from './journey.ts';
import { EXAMINATION_FILE_UPLOAD_QUESTIONS } from './questions.ts';

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
		}
	} as unknown as PortalService;
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
						status: 'in-progress',
						statusLookup: { displayName: 'In progress' }
					}
				}
			} as unknown as Request,
			{ locals } as unknown as Response
		);

		assert.deepEqual(locals.statusTag, {
			label: 'In progress',
			class: 'govuk-tag govuk-tag--blue'
		});

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
});
