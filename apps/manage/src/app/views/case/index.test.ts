import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import type { UploadedFile } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import { syncUploadAnswer } from './index.ts';

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
