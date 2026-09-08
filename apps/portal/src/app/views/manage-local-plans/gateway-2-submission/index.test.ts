import assert from 'node:assert';
import type { Request } from 'express';
import { describe, it } from 'node:test';
import type { UploadedFile } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import { syncGateway2UploadAnswer, buildSubmittedGateway2View } from './index.ts';
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

describe('Gateway 2 post-submission view template', () => {
	it('renders submission copy with date, time and submitter', () => {
		const nunjucks = configureNunjucks();
		const html = nunjucks.render('views/manage-local-plans/gateway-2-submission/check-your-answers-submitted.njk', {
			pageTitle: 'Gateway 2 submission',
			pageHeading: 'Gateway 2 submission',
			pageCaption: 'East Borough Local Plan',
			submissionDate: '1 September 2026',
			submissionTime: '14:30',
			submitter: 'user@example.com',
			summaryListData: {
				sections: [
					{
						heading: 'Procedural Documents',
						list: {
							rows: [
								{
									key: { text: 'Gateway 2 covering letter' },
									value: { html: 'cover-letter.pdf' },
									actions: { items: [{ href: '/change', text: 'Change' }] }
								}
							]
						}
					},
					{
						heading: 'Consultation Documents',
						list: {
							rows: [
								{
									key: { text: 'Notice of intention' },
									value: { html: '<ul class="govuk-list"><li>notice1.pdf</li><li>notice2.pdf</li></ul>' },
									actions: { items: [{ href: '/change', text: 'Change' }] }
								}
							]
						}
					},
					{
						heading: 'Additional Documents',
						list: {
							rows: [
								{
									key: { text: 'Subsequent work towards a draft Plan' },
									value: { html: 'draft-plan.pdf' },
									actions: { items: [{ href: '/change', text: 'Change' }] }
								}
							]
						}
					}
				]
			},
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			}
		});

		assert.ok(
			html.includes('Your application was submitted on 1 September 2026 at 14:30 by user@example.com'),
			'expected submission copy with date, time and submitter'
		);
	});

	it('renders H1 heading and plan title caption', () => {
		const nunjucks = configureNunjucks();
		const html = nunjucks.render('views/manage-local-plans/gateway-2-submission/check-your-answers-submitted.njk', {
			pageTitle: 'Gateway 2 submission',
			pageHeading: 'Gateway 2 submission',
			pageCaption: 'East Borough Local Plan',
			submissionDate: '1 September 2026',
			summaryListData: { sections: [] },
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			}
		});

		assert.ok(html.includes('Gateway 2 submission'), 'expected H1 heading');
		assert.ok(html.includes('East Borough Local Plan'), 'expected plan title caption');
	});

	it('renders section headings for Procedural, Consultation and Additional Documents', () => {
		const nunjucks = configureNunjucks();
		const html = nunjucks.render('views/manage-local-plans/gateway-2-submission/check-your-answers-submitted.njk', {
			pageTitle: 'Gateway 2 submission',
			pageHeading: 'Gateway 2 submission',
			submissionDate: '1 September 2026',
			summaryListData: {
				sections: [
					{ heading: 'Procedural Documents', list: { rows: [{ key: { text: 'Doc' }, value: { text: 'file.pdf' } }] } },
					{
						heading: 'Consultation Documents',
						list: { rows: [{ key: { text: 'Doc' }, value: { text: 'file.pdf' } }] }
					},
					{ heading: 'Additional Documents', list: { rows: [{ key: { text: 'Doc' }, value: { text: 'file.pdf' } }] } }
				]
			},
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			}
		});

		assert.ok(html.includes('Procedural Documents'), 'expected Procedural Documents heading');
		assert.ok(html.includes('Consultation Documents'), 'expected Consultation Documents heading');
		assert.ok(html.includes('Additional Documents'), 'expected Additional Documents heading');
	});

	it('does not render Change or Add actions or submit button', () => {
		const nunjucks = configureNunjucks();
		const html = nunjucks.render('views/manage-local-plans/gateway-2-submission/check-your-answers-submitted.njk', {
			pageTitle: 'Gateway 2 submission',
			pageHeading: 'Gateway 2 submission',
			submissionDate: '1 September 2026',
			summaryListData: {
				sections: [
					{
						heading: 'Procedural Documents',
						list: {
							rows: [
								{
									key: { text: 'Gateway 2 covering letter' },
									value: { html: 'cover-letter.pdf' },
									actions: { items: [{ href: '/change', text: 'Change' }] }
								}
							]
						}
					}
				]
			},
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			}
		});

		assert.ok(!html.includes('Change'), 'expected no Change action');
		assert.ok(!html.includes('>Add<'), 'expected no Add action');
		assert.ok(!html.includes('Submit for Gateway 2 assessment'), 'expected no submit button');
		assert.ok(!html.includes('Save and come back later'), 'expected no save and come back link');
	});

	it('renders multiple documents as bullet points', () => {
		const nunjucks = configureNunjucks();
		const html = nunjucks.render('views/manage-local-plans/gateway-2-submission/check-your-answers-submitted.njk', {
			pageTitle: 'Gateway 2 submission',
			pageHeading: 'Gateway 2 submission',
			submissionDate: '1 September 2026',
			summaryListData: {
				sections: [
					{
						heading: 'Procedural Documents',
						list: {
							rows: [
								{
									key: { text: 'Gateway 2 covering letter' },
									value: { html: '<ul class="govuk-list"><li>letter1.pdf</li><li>letter2.pdf</li></ul>' }
								}
							]
						}
					}
				]
			},
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			}
		});

		assert.ok(html.includes('<ul class="govuk-list">'), 'expected bullet list for multiple documents');
		assert.ok(html.includes('<li>letter1.pdf</li>'), 'expected first document in list');
		assert.ok(html.includes('<li>letter2.pdf</li>'), 'expected second document in list');
	});
});

describe('buildSubmittedGateway2View middleware', () => {
	it('sets submitted template and locals when case has submissionDate', () => {
		const middleware = buildSubmittedGateway2View();
		const submissionDate = new Date('2026-09-01T14:30:00Z');
		const req = {
			currentCase: {
				submissionDate,
				email: 'user@example.com'
			}
		} as any;

		const locals: Record<string, unknown> = {
			journey: { taskListTemplate: 'original-template.njk' },
			saveAndComeBackUrl: '/save'
		};
		const res = { locals } as any;

		let nextCalled = false;
		middleware(req, res, () => {
			nextCalled = true;
		});

		assert.ok(nextCalled, 'expected next() to be called');
		assert.strictEqual(
			(locals.journey as { taskListTemplate: string }).taskListTemplate,
			'views/manage-local-plans/gateway-2-submission/check-your-answers-submitted.njk'
		);
		assert.ok(locals.submissionDate, 'expected submissionDate to be set');
		assert.ok(locals.submissionTime, 'expected submissionTime to be set');
		assert.strictEqual(locals.submitter, 'user@example.com');
		assert.strictEqual(locals.saveAndComeBackUrl, undefined, 'expected saveAndComeBackUrl to be removed');
	});

	it('calls next without changes when case has no submissionDate', () => {
		const middleware = buildSubmittedGateway2View();
		const req = {
			currentCase: {
				submissionDate: null,
				email: 'user@example.com'
			}
		} as any;

		const locals: Record<string, unknown> = {
			journey: { taskListTemplate: 'original-template.njk' },
			saveAndComeBackUrl: '/save'
		};
		const res = { locals } as any;

		let nextCalled = false;
		middleware(req, res, () => {
			nextCalled = true;
		});

		assert.ok(nextCalled, 'expected next() to be called');
		assert.strictEqual((locals.journey as { taskListTemplate: string }).taskListTemplate, 'original-template.njk');
		assert.strictEqual(locals.saveAndComeBackUrl, '/save');
		assert.strictEqual(locals.submissionDate, undefined);
	});
});
