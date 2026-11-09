import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import type { UploadedFile } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import { caseRouter, syncUploadAnswer, shouldContinueToReportUpload, redirectAfterCyaEdit } from './index.ts';
import { journeyFileUploadQuestionConfigs } from './controller.ts';
import { COMMON_CONSTS } from '../../classes/common-consts.ts';

describe('caseRouter', () => {
	it('registers routes when a non-upload journey has no upload configuration', () => {
		const journeyId = COMMON_CONSTS.EXAMINATION_PAUSE_JOURNEY_ID;
		const uploadConfig = journeyFileUploadQuestionConfigs[journeyId];
		delete journeyFileUploadQuestionConfigs[journeyId];
		try {
			assert.doesNotThrow(() => caseRouter({} as Parameters<typeof caseRouter>[0]));
		} finally {
			journeyFileUploadQuestionConfigs[journeyId] = uploadConfig;
		}
	});
});

describe('redirectAfterCyaEdit', () => {
	it('directs to CYA page when basic question', () => {
		let returnToCya: boolean | undefined;

		const req = {
			params: { question: 'gateway-2-report' },
			body: {},
			session: {
				editingFromCheckAnswers: true
			}
		} as any;

		const res = { locals: {} } as any;
		const next = () => {};

		const save = (_updateCase: any, shouldReturnToCya: boolean) => {
			returnToCya = shouldReturnToCya;
			return (_req: any, _res: any, _next: any) => {};
		};

		redirectAfterCyaEdit(() => {}, save)(req, res, next);

		assert.equal(returnToCya, true);
	});

	it('does not direct to CYA page when question is hearing-end-date or hearing-duration', () => {
		let returnToCya: boolean | undefined;

		const req = {
			params: { question: 'examination-hearing-end-date-1' },
			body: {},
			session: {
				editingFromCheckAnswers: true
			}
		} as any;

		const res = { locals: {} } as any;

		const save = (_updateCase: any, shouldReturnToCya: boolean) => {
			returnToCya = shouldReturnToCya;
			return (_req: any, _res: any, _next: any) => {};
		};

		redirectAfterCyaEdit(() => {}, save)(req, res, () => {});

		assert.equal(returnToCya, false);
		assert.equal(res.locals.redirectToExamination, true);
	});

	it('directs to CYA page when question answer is no', () => {
		let returnToCya: boolean | undefined;

		const req = {
			params: { question: 'examination-hearing-remote-meeting-link-known-1' },
			body: { answer: 'no' },
			session: {
				editingFromCheckAnswers: true
			}
		} as any;

		const res = { locals: {} } as any;

		const save = (_updateCase: any, shouldReturnToCya: boolean) => {
			returnToCya = shouldReturnToCya;
			return (_req: any, _res: any, _next: any) => {};
		};

		redirectAfterCyaEdit(() => {}, save)(req, res, () => {});

		assert.equal(returnToCya, true);
		assert.equal(req.session.editingFromCheckAnswers, true);
	});

	it('directs to next question page when question answer is yes', () => {
		let returnToCya: boolean | undefined;

		const req = {
			params: { question: 'examination-hearing-remote-meeting-link-known-1' },
			body: { answer: 'yes' },
			session: {
				editingFromCheckAnswers: true
			}
		} as any;

		const res = { locals: {} } as any;

		const save = (_updateCase: any, shouldReturnToCya: boolean) => {
			returnToCya = shouldReturnToCya;
			return (_req: any, _res: any, _next: any) => {};
		};

		redirectAfterCyaEdit(() => {}, save)(req, res, () => {});

		assert.equal(returnToCya, false);
		assert.equal(req.session.editingFromCheckAnswers, false);
		assert.equal(req.session.returnToCyaAfterAnswer, true);
	});

	it('directs to CYA page when returnToCyaAfterAnswer is true', () => {
		let returnToCya: boolean | undefined;

		const req = {
			params: { question: 'examination-hearing-remote-meeting-link-1' },
			body: {},
			session: {
				editingFromCheckAnswers: false,
				returnToCyaAfterAnswer: true
			}
		} as any;

		const res = { locals: {} } as any;

		const save = (_updateCase: any, shouldReturnToCya: boolean) => {
			returnToCya = shouldReturnToCya;
			return (_req: any, _res: any, _next: any) => {};
		};

		redirectAfterCyaEdit(() => {}, save)(req, res, () => {});

		assert.equal(returnToCya, true);
		assert.equal(req.session.returnToCyaAfterAnswer, false);
		assert.equal(req.session.editingFromCheckAnswers, true);
	});
	it('directs to next question page when editting location type', () => {
		let returnToCya: boolean | undefined;

		const req = {
			params: { question: 'examination-hearing-location-type-' },
			body: {},
			session: {
				editingFromCheckAnswers: true
			}
		} as any;

		const res = { locals: {} } as any;

		const save = (_updateCase: any, shouldReturnToCya: boolean) => {
			returnToCya = shouldReturnToCya;
			return (_req: any, _res: any, _next: any) => {};
		};

		redirectAfterCyaEdit(() => {}, save)(req, res, () => {});

		assert.equal(returnToCya, false);
		assert.equal(req.session.editingFromCheckAnswers, false);
	});
});

describe('shouldContinueToReportUpload', () => {
	const examination = COMMON_CONSTS.EXAMINATION_JOURNEY_ID;
	const report = [{ id: 'report-1' }];

	it('continues to the uploader when no report is uploaded and no report issued date is set', () => {
		assert.equal(shouldContinueToReportUpload(examination, 'outcome', 'plan-outcome', undefined, {}), true);
	});

	it('continues to the uploader when the report issued date was already added before the report', () => {
		const answers = { soundUnsoundDate: new Date('2026-10-19'), isSound: 'sound' };
		assert.equal(shouldContinueToReportUpload(examination, 'outcome', 'plan-outcome', undefined, answers), true);
	});

	it('does not continue to the uploader when a report is already uploaded', () => {
		const answers = { soundUnsoundDate: new Date('2026-10-19'), examinationReport: report };
		assert.equal(shouldContinueToReportUpload(examination, 'outcome', 'plan-outcome', undefined, answers), false);
	});

	it('does not continue when returning to the check page', () => {
		assert.equal(shouldContinueToReportUpload(examination, 'outcome', 'plan-outcome', 'check', {}), false);
	});

	it('does not continue for other questions or journeys', () => {
		assert.equal(shouldContinueToReportUpload(examination, 'outcome', 'sound-unsound-date', undefined, {}), false);
		assert.equal(shouldContinueToReportUpload(examination, 'other', 'plan-outcome', undefined, {}), false);
		assert.equal(shouldContinueToReportUpload('gateway-2', 'outcome', 'plan-outcome', undefined, {}), false);
	});
});

describe('syncUploadAnswer', () => {
	it('keeps upload answers separate for each case', () => {
		const session: { forms?: Record<string, unknown> } = {};
		const firstCase = { params: { reference: 'PLAN-111111' }, session } as unknown as Request;
		const secondCase = { params: { reference: 'PLAN-222222' }, session } as unknown as Request;
		const firstFile: UploadedFile = {
			id: 'file-1',
			fileName: 'first-case.pdf',
			mimeType: 'application/pdf',
			size: 100,
			storageProvider: 'blob'
		};
		const secondFile: UploadedFile = { ...firstFile, id: 'file-2', fileName: 'second-case.pdf' };

		syncUploadAnswer('gateway-2', firstCase, 'gateway2Report', [firstFile]);
		syncUploadAnswer('gateway-2', secondCase, 'gateway2Report', [secondFile]);

		assert.deepEqual(session.forms, {
			'PLAN-111111': { 'gateway-2': { gateway2Report: [firstFile] } },
			'PLAN-222222': { 'gateway-2': { gateway2Report: [secondFile] } }
		});
	});
});
