import assert from 'node:assert';
import type { Request } from 'express';
import { describe, it } from 'node:test';
import type { UploadedFile } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import { normalisePlanReferenceForLookup, syncGateway2CoverLetterAnswer } from './index.ts';

describe('normalisePlanReferenceForLookup', () => {
	it('keeps hyphenated LPE references unchanged', () => {
		assert.strictEqual(normalisePlanReferenceForLookup('LPE-TEST-001'), 'LPE-TEST-001');
	});

	it('converts legacy PLAN route references back to stored case references', () => {
		assert.strictEqual(normalisePlanReferenceForLookup('PLAN-001'), 'PLAN/001');
	});

	it('keeps already normalised references unchanged', () => {
		assert.strictEqual(normalisePlanReferenceForLookup('PLAN/001'), 'PLAN/001');
	});
});

describe('syncGateway2CoverLetterAnswer', () => {
	it('stores uploaded files in the case-scoped journey answers', () => {
		const uploadedFile = buildUploadedFile({ id: 'file-1', fileName: 'cover-letter.pdf' });
		const req = {
			params: { planReference: 'LPE-TEST-001' },
			session: {}
		};

		syncGateway2CoverLetterAnswer(req as unknown as Request, [uploadedFile]);

		assert.deepEqual(req.session, {
			forms: {
				'LPE-TEST-001': {
					'gateway-2-application': {
						gateway2CoverLetter: [uploadedFile]
					}
				}
			}
		});
	});

	it('removes the case-scoped journey answer when no uploaded files remain', () => {
		const req = {
			params: { planReference: 'LPE-TEST-001' },
			session: {
				forms: {
					'LPE-TEST-001': {
						'gateway-2-application': {
							gateway2CoverLetter: [buildUploadedFile({ id: 'file-1' })]
						}
					}
				}
			}
		};

		syncGateway2CoverLetterAnswer(req as unknown as Request, []);

		assert.deepEqual(req.session.forms['LPE-TEST-001']['gateway-2-application'], {});
	});
});

function buildUploadedFile(overrides: Partial<UploadedFile> = {}): UploadedFile {
	return {
		id: 'file-1',
		fileName: 'cover-letter.pdf',
		mimeType: 'application/pdf',
		size: 100,
		storageProvider: 'blob',
		...overrides
	};
}
