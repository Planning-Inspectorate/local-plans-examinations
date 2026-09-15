import assert from 'node:assert';
import type { Request } from 'express';
import { describe, it } from 'node:test';
import type { UploadedFile } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import { buildGateway2ReportFilesViewModel, syncGateway2UploadAnswer } from './index.ts';
import { JOURNEY_ID } from './journey.ts';
import { configureNunjucks } from '../../../nunjucks.ts';
import { GW2QUESTIONS } from './questions.ts';

const GATEWAY_2_COVER_LETTER_UPLOAD_GUIDANCE =
	'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB. The total size of your uploaded files must be smaller than 1GB.';

describe('Gateway 2 covering letter upload page', () => {
	it('renders file requirements and total upload size guidance as one paragraph', () => {
		const nunjucks = configureNunjucks();
		const html = nunjucks.render('forms/custom-components/file-uploader/index.njk', {
			layoutTemplate: 'views/layouts/main.njk',
			question: GW2QUESTIONS.gateway2CoverLetter,
			uploadedFiles: [],
			uploadedFilesEncoded: Buffer.from(JSON.stringify([]), 'utf-8').toString('base64'),
			currentUrl: '/manage-local-plans/PLAN-001/gateway-2-submission/procedural/gateway-2-cover-letter',
			errors: {},
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			}
		});

		const bodyParagraphs = [...html.matchAll(/<p class="govuk-body"[^>]*>([^<]+)<\/p>/g)].map((match) =>
			match[1].trim()
		);

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

describe('Gateway 2 submission check answers page', () => {
	it('hides the Gateway 2 report row before the report is issued', () => {
		const nunjucks = configureNunjucks();
		const html = nunjucks.render('views/manage-local-plans/gateway-2-submission/check-your-answers.njk', {
			targetDate: '21 July 2026',
			saveAndComeBackUrl: '/manage-local-plans/PLAN-001',
			showGateway2Report: false,
			gateway2ReportFiles: [],
			summaryListData: { sections: [] },
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			}
		});

		assert.ok(!html.includes('data-cy="gateway-2-report-section"'));
		assert.ok(!html.includes('Gateway 2 report'));
	});

	it('shows the Gateway 2 report row after the report is issued', () => {
		const nunjucks = configureNunjucks();
		const html = nunjucks.render('views/manage-local-plans/gateway-2-submission/check-your-answers.njk', {
			targetDate: '21 July 2026',
			saveAndComeBackUrl: '/manage-local-plans/PLAN-001',
			showGateway2Report: true,
			gateway2ReportFiles: [
				{
					fileName: 'gateway-2-report.pdf',
					href: '/manage-local-plans/PLAN-001/gateway-2-submission/download-document/document-guid-1',
					sharedDate: '8 May 2026'
				}
			],
			summaryListData: { sections: [] },
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			}
		});

		assert.ok(html.includes('data-cy="gateway-2-report-section"'));
		assert.ok(html.includes('Gateway 2 report'));
		assert.ok(html.includes('gateway-2-report.pdf'));
		assert.ok(html.includes('shared on 8 May 2026'));
		assert.ok(html.includes('/manage-local-plans/PLAN-001/gateway-2-submission/download-document/document-guid-1'));
		assert.ok(
			html.indexOf('data-cy="gateway-2-report-section"') < html.indexOf('Your target submission date is 21 July 2026'),
			'expected the Gateway 2 report row to render above the target submission date message'
		);
	});
});

describe('Gateway 1 self assessment upload page', () => {
	it('renders the upload guidance for the consultation document question', () => {
		const nunjucks = configureNunjucks();
		const html = nunjucks.render('forms/custom-components/file-uploader/index.njk', {
			layoutTemplate: 'views/layouts/main.njk',
			question: GW2QUESTIONS.gateway1SelfAssessment,
			uploadedFiles: [],
			uploadedFilesEncoded: Buffer.from(JSON.stringify([]), 'utf-8').toString('base64'),
			currentUrl: '/manage-local-plans/PLAN-001/gateway-2-submission/consultation/g1-self-assess',
			errors: {},
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			}
		});

		assert.ok(html.includes('Consultation documents'));
		assert.ok(html.includes('Upload your Gateway 1 - Self Assessment of Readiness'));
		assert.ok(html.includes('Drag and drop or choose files'));
		assert.ok(html.includes(GATEWAY_2_COVER_LETTER_UPLOAD_GUIDANCE));
	});
});

describe('Consultation on proposed content upload page', () => {
	it('renders the upload guidance for the consultation document question', () => {
		const nunjucks = configureNunjucks();
		const html = nunjucks.render('forms/custom-components/file-uploader/index.njk', {
			layoutTemplate: 'views/layouts/main.njk',
			question: GW2QUESTIONS.consultationOnProposedContent,
			uploadedFiles: [],
			uploadedFilesEncoded: Buffer.from(JSON.stringify([]), 'utf-8').toString('base64'),
			currentUrl: '/manage-local-plans/PLAN-001/gateway-2-submission/consultation/cons-of-proposed',
			errors: {},
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			}
		});

		assert.ok(html.includes('Consultation documents'));
		assert.ok(html.includes('Upload your Consultation on proposed local plan content and evidence documents'));
		assert.ok(html.includes('Drag and drop or choose files'));
		assert.ok(html.includes(GATEWAY_2_COVER_LETTER_UPLOAD_GUIDANCE));
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

describe('buildGateway2ReportFilesViewModel', () => {
	it('builds read-only Gateway 2 report download links', () => {
		const files = [
			buildUploadedFile({
				fileName: 'gateway-2%20report.pdf',
				dateCreated: new Date('2026-05-08T12:00:00.000Z'),
				metadata: {
					documentGuid: 'document-guid-1'
				}
			})
		];

		assert.deepEqual(buildGateway2ReportFilesViewModel('PLAN/123456', files), [
			{
				fileName: 'gateway-2 report.pdf',
				href: '/manage-local-plans/PLAN%2F123456/gateway-2-submission/download-document/document-guid-1',
				sharedDate: '8 May 2026'
			}
		]);
	});

	it('omits the download link when the document guid is missing', () => {
		const files = [
			buildUploadedFile({
				fileName: 'gateway-2-report.pdf'
			})
		];

		assert.deepEqual(buildGateway2ReportFilesViewModel('PLAN/123456', files), [
			{
				fileName: 'gateway-2-report.pdf',
				href: undefined,
				sharedDate: undefined
			}
		]);
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
