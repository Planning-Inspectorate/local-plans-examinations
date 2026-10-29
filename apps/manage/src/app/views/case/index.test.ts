import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import type { UploadedFile } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import { caseRouter, syncUploadAnswer, shouldContinueToReportUpload } from './index.ts';
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
