import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import type { UploadedFile } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import { caseRouter, syncUploadAnswer } from './index.ts';
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
