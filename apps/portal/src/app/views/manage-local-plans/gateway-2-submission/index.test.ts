import assert from 'node:assert';
import type { Request } from 'express';
import { describe, it } from 'node:test';
import type { UploadedFile } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import { syncGateway2UploadAnswer } from './index.ts';
import { JOURNEY_ID } from './journey.ts';
import { configureNunjucks } from '../../../nunjucks.ts';
import { gateway2CoverLetterQuestion } from './questions.ts';

const GATEWAY_2_COVER_LETTER_UPLOAD_GUIDANCE =
	'Each file must be a DOC, DOCX, PDF, TIF, JPG or PNG and be smaller than 250MB. The total size of your uploaded files must be smaller than 1GB.';

describe('Gateway 2 covering letter upload page', () => {
	it('renders file requirements and total upload size guidance as one paragraph', () => {
		const nunjucks = configureNunjucks();
		const html = nunjucks.render('forms/custom-components/file-uploader/index.njk', {
			layoutTemplate: 'views/layouts/main.njk',
			question: gateway2CoverLetterQuestion,
			uploadedFiles: [],
			uploadedFilesEncoded: Buffer.from(JSON.stringify([]), 'utf-8').toString('base64'),
			currentUrl: '/manage-local-plans/PLAN%2F001/gateway-2-submission/procedural/gateway-2-cover-letter',
			errors: {},
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			}
		});

		const bodyParagraphs = [...html.matchAll(/<p class="govuk-body">([^<]+)<\/p>/g)].map((match) => match[1].trim());

		assert.ok(
			bodyParagraphs.includes(GATEWAY_2_COVER_LETTER_UPLOAD_GUIDANCE),
			'expected the combined upload guidance to render as one paragraph'
		);
		assert.ok(
			!bodyParagraphs.includes('The total size of your uploaded files must be smaller than 1GB.'),
			'expected the total upload size guidance not to render as a separate paragraph'
		);
	});
});

describe('syncGateway2UploadAnswer', () => {
	it('stores uploaded files in the case-scoped journey answers', () => {
		const uploadedFile = buildUploadedFile({ id: 'file-1', fileName: 'cover-letter.pdf' });
		const req = {
			params: { planReference: 'LPE-TEST-001' },
			session: {}
		};

		syncGateway2UploadAnswer(req as unknown as Request, 'gateway2CoverLetter', [uploadedFile]);

		assert.deepEqual(req.session, {
			forms: {
				'LPE-TEST-001': {
					[JOURNEY_ID]: {
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
						[JOURNEY_ID]: {
							gateway2CoverLetter: [buildUploadedFile({ id: 'file-1' })]
						}
					}
				}
			}
		};

		syncGateway2UploadAnswer(req as unknown as Request, 'gateway2CoverLetter', []);

		assert.deepEqual(req.session.forms['LPE-TEST-001'][JOURNEY_ID], {});
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
