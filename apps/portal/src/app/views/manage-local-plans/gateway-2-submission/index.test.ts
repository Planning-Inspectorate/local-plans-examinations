import assert from 'node:assert';
import type { Request } from 'express';
import { describe, it } from 'node:test';
import type { UploadedFile } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import { DOCUMENT_SET_ID } from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';
import { buildGateway2ReportFilesViewModel } from '../../plan-page/gateway-2-report.ts';
import {
	syncGateway2UploadAnswer,
	buildSubmittedGateway2View,
	formatWorkshopTime,
	setGateway2CheckAnswersViewLocals
} from './controller.ts';
import { JOURNEY_ID } from './journey.ts';
import { configureNunjucks } from '../../../nunjucks.ts';
import { GW2QUESTIONS } from './questions.ts';
import { STATUS, StatusTag } from '../../../types.ts';

const GATEWAY_2_COVER_LETTER_UPLOAD_GUIDANCE =
	'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB. The total size of your uploaded files must be smaller than 1GB.';

describe('Gateway 2 cover letter upload page', () => {
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

		const hintParagraphs = [...html.matchAll(/<p class="govuk-hint"[^>]*>([^<]+)<\/p>/g)].map((match) =>
			match[1].trim()
		);

		assert.ok(
			hintParagraphs.includes(GATEWAY_2_COVER_LETTER_UPLOAD_GUIDANCE),
			'expected the combined upload guidance to render as one hint paragraph'
		);
		assert.ok(
			!hintParagraphs.includes('The total size of your uploaded files must be smaller than 1GB.'),
			'expected the total upload size guidance not to render as a separate paragraph'
		);
	});
});

describe('Gateway 2 submission check answers page', () => {
	it('renders the Gateway 2 report metadata', () => {
		const nunjucks = configureNunjucks();
		const html = nunjucks.render('views/manage-local-plans/gateway-2-submission/check-your-answers.njk', {
			targetDate: '21 July 2026',
			saveAndComeBackUrl: '/manage-local-plans/PLAN-001',
			gateway2ReportFiles: [
				{
					fileName: 'gateway-2-report.pdf',
					href: '/manage-local-plans/PLAN-001/gateway-2-submission/download-document/report-guid',
					sharedDate: '24 September 2026'
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
		assert.ok(html.includes('(shared on 24 September 2026)'));
	});

	it('renders the virus scan in progress banner at the top when a scan is in progress', () => {
		const nunjucks = configureNunjucks();
		const html = nunjucks.render('views/manage-local-plans/gateway-2-submission/check-your-answers.njk', {
			summaryListData: { sections: [] },
			virusScanInProgress: true,
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			}
		});

		assert.ok(html.includes('data-cy="virus-scan-in-progress-banner"'));
		assert.ok(html.includes('Virus scan in progress'));
	});

	it('renders the virus detected banner at the top when a file is affected', () => {
		const nunjucks = configureNunjucks();
		const html = nunjucks.render('views/manage-local-plans/gateway-2-submission/check-your-answers.njk', {
			summaryListData: { sections: [] },
			virusErrorSummary: [
				{
					text: 'bad.pdf contains a virus. Remove the file and upload a different version.',
					href: '#uploaded-file-file-1'
				}
			],
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			}
		});

		assert.ok(html.includes('data-cy="virus-detected-banner"'));
		assert.ok(html.includes('bad.pdf contains a virus'));
	});

	it('renders the Gateway 2 report beneath the available workshop details', () => {
		const nunjucks = configureNunjucks();
		const html = nunjucks.render('views/manage-local-plans/gateway-2-submission/check-your-answers.njk', {
			targetDate: '21 July 2026',
			gateway2ReportFiles: [{ fileName: 'gateway-2-report.pdf' }],
			hasWorkshop: true,
			workshopFormat: 'in-person',
			workshopVenue: ['East Borough Civic Centre', '14 Market Street', 'East Borough', 'EB1 4QT'],
			workShopStartTime: '10:00, 12 May 2026',
			workshopDocuments: [
				{
					fileName: 'workshop-agenda.pdf',
					href: '/manage-local-plans/PLAN-001/gateway-2-submission/download-document/workshop-guid',
					sharedDate: '8 April 2026'
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

		const reportPosition = html.indexOf('data-cy="gateway-2-report-section"');
		const workshopPosition = html.indexOf('data-cy="gateway-2-workshop-section"');
		assert.ok(workshopPosition >= 0 && reportPosition > workshopPosition);
		assert.match(html, /<h2 class="govuk-heading-m">Workshop<\/h2>/);
		const workshopHtml = html.slice(workshopPosition, reportPosition);
		const keys = [...workshopHtml.matchAll(/<dt class="govuk-summary-list__key">\s*([^<]+?)\s*<\/dt>/g)].map(
			(m) => m[1]
		);
		assert.deepStrictEqual(keys, ['Format', 'Venue', 'Start time', 'Documents']);
		assert.match(html, /Format(?:\s|<[^>]+>)*In-person/);
		assert.match(html, /East Borough Civic Centre<br>14 Market Street<br>East Borough<br>EB1 4QT/);
		assert.match(html, /Start time(?:\s|<[^>]+>)*10:00, 12 May 2026/);
		assert.ok(html.includes('workshop-agenda.pdf'));
		assert.ok(html.includes('(shared: 8 April 2026)'));
	});

	it('hides the documents row when no workshop documents have been uploaded', () => {
		const nunjucks = configureNunjucks();
		const html = nunjucks.render('views/manage-local-plans/gateway-2-submission/check-your-answers.njk', {
			hasWorkshop: true,
			workshopFormat: 'in-person',
			workshopVenue: ['East Borough Civic Centre'],
			workShopStartTime: '10:00, 12 May 2026',
			summaryListData: { sections: [] },
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			}
		});

		assert.match(html, /Venue\s*<\/dt>/);
		assert.ok(!/Documents\s*<\/dt>/.test(html));
	});

	it('shows workshop documents before the workshop has been set up', () => {
		const nunjucks = configureNunjucks();
		const html = nunjucks.render('views/manage-local-plans/gateway-2-submission/check-your-answers.njk', {
			workshopDocuments: [{ fileName: 'workshop-agenda.pdf', sharedDate: '8 April 2026' }],
			summaryListData: { sections: [] },
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			}
		});

		assert.ok(html.includes('data-cy="gateway-2-workshop-section"'));
		assert.match(html, /Documents\s*<\/dt>/);
		assert.ok(!/(Format|Venue|Start time)\s*<\/dt>/.test(html));
	});

	it('hides the workshop section when there is no workshop and no documents', () => {
		const nunjucks = configureNunjucks();
		const html = nunjucks.render('views/manage-local-plans/gateway-2-submission/check-your-answers.njk', {
			summaryListData: { sections: [] },
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			}
		});

		assert.ok(!html.includes('data-cy="gateway-2-workshop-section"'));
	});

	it('shows Not provided when an in-person workshop has no address', () => {
		const nunjucks = configureNunjucks();
		const html = nunjucks.render('views/manage-local-plans/gateway-2-submission/check-your-answers.njk', {
			hasWorkshop: true,
			workshopFormat: 'in-person',
			summaryListData: { sections: [] },
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			}
		});

		assert.match(html, /Venue(?:\s|<[^>]+>)*Not provided/);
	});

	it('hides the venue and shows the meeting link for a remote workshop', () => {
		const nunjucks = configureNunjucks();
		const html = nunjucks.render('views/manage-local-plans/gateway-2-submission/check-your-answers.njk', {
			hasWorkshop: true,
			workshopFormat: 'remote',
			workshopMeetingLink: 'https://teams.example.com/meeting/123',
			summaryListData: { sections: [] },
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			}
		});

		assert.match(html, /Format(?:\s|<[^>]+>)*Remote/);
		assert.ok(!/Venue\s*<\/dt>/.test(html));
		assert.match(html, /Meeting link\s*<\/dt>/);
		assert.ok(html.includes('<a href="https://teams.example.com/meeting/123" class="govuk-link"'));
	});

	it('hides the meeting link row for a remote workshop without a link', () => {
		const nunjucks = configureNunjucks();
		const html = nunjucks.render('views/manage-local-plans/gateway-2-submission/check-your-answers.njk', {
			hasWorkshop: true,
			workshopFormat: 'remote',
			summaryListData: { sections: [] },
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			}
		});

		assert.ok(!/Meeting link\s*<\/dt>/.test(html));
		assert.ok(!/Venue\s*<\/dt>/.test(html));
	});

	it('does not turn a non-http meeting link into a link', () => {
		const nunjucks = configureNunjucks();
		const html = nunjucks.render('views/manage-local-plans/gateway-2-submission/check-your-answers.njk', {
			hasWorkshop: true,
			workshopFormat: 'hybrid',
			workshopVenue: ['Town Hall'],
			workshopMeetingLink: 'javascript:alert(1)',
			summaryListData: { sections: [] },
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			}
		});

		assert.ok(!html.includes('href="javascript:'));
		assert.match(html, /Meeting link\s*<\/dt>/);
	});

	it('renders multiple workshop documents as a list', () => {
		const nunjucks = configureNunjucks();
		const html = nunjucks.render('views/manage-local-plans/gateway-2-submission/check-your-answers.njk', {
			workshopDocuments: [{ fileName: 'workshop-agenda.pdf' }, { fileName: 'workshop-questions.pdf' }],
			summaryListData: { sections: [] },
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			}
		});

		assert.ok(html.includes('<ul class="govuk-list">'));
		assert.match(html, /<li>\s*workshop-agenda\.pdf\s*<\/li>/);
		assert.match(html, /<li>\s*workshop-questions\.pdf\s*<\/li>/);
	});
});

describe('formatWorkshopTime', () => {
	const cases: [string, string][] = [
		['09:00', '9am'],
		['10:00', '10am'],
		['10:15', '10:15am'],
		['11:44', '11:44am'],
		['12:00', 'midday'],
		['12:30', '12:30pm'],
		['13:00', '1pm'],
		['14:30', '2:30pm'],
		['23:59', '11:59pm'],
		['00:00', 'midnight'],
		['00:30', '12:30am'],
		['9:05', '9:05am'],
		[' 10:00 ', '10am']
	];

	for (const [input, expected] of cases) {
		it(`formats ${JSON.stringify(input)} as ${expected}`, () => {
			assert.strictEqual(formatWorkshopTime(input), expected);
		});
	}

	it('returns values that are not a valid HH:MM time unchanged', () => {
		for (const value of ['', 'TBC', '10am', '1000', '24:00', '12:60', '10:5']) {
			assert.strictEqual(formatWorkshopTime(value), value);
		}
	});
});

describe('Gateway 2 workshop start time locals', () => {
	function startTimeFor(workshopTime: string | null, workshopDate: Date | null) {
		const middleware = buildSubmittedGateway2View();
		const req = {
			currentCase: {
				submissionDate: new Date('2026-09-01T14:30:00Z'),
				email: 'user@example.com',
				gateway2Info: {
					workshops: [
						{
							createdDate: new Date('2026-09-01T09:00:00Z'),
							workshopDate,
							workshopTime,
							workshopEndTime: null,
							workshopLocationType: 'in-person',
							remoteMeetingLinkKnown: null,
							remoteMeetingLink: null,
							workshopVenueName: 'Town Hall',
							workshopAddressLine: null,
							workshopAddressLine2: null,
							workshopTownOrCity: null,
							workshopPostcode: null
						}
					]
				}
			}
		} as any;
		const locals: Record<string, unknown> = { journey: { taskListTemplate: 'original-template.njk' } };

		middleware(req, { locals } as any, () => {});

		return locals.workShopStartTime;
	}

	it('shows the formatted time before the date', () => {
		assert.strictEqual(startTimeFor('14:30', new Date('2026-05-12T12:00:00Z')), '2:30pm, 12 May 2026');
	});

	it('shows midday for 12:00', () => {
		assert.strictEqual(startTimeFor('12:00', new Date('2026-05-12T12:00:00Z')), 'midday, 12 May 2026');
	});

	it('shows only the date when there is no time', () => {
		assert.strictEqual(startTimeFor(null, new Date('2026-05-12T12:00:00Z')), '12 May 2026');
	});

	it('shows only the time when there is no date', () => {
		assert.strictEqual(startTimeFor('09:30', null), '9:30am');
	});

	it('is undefined when there is no time or date', () => {
		assert.strictEqual(startTimeFor(null, null), undefined);
	});
});

describe('Gateway 2 summary view data', () => {
	it('separates report and workshop documents and formats workshop details', () => {
		const req = {
			params: { planReference: 'PLAN-001' },
			currentCase: {
				planTitle: 'East Borough Local Plan',
				gateway2Info: {
					expectedDate: null,
					reportIssuedDate: new Date('2026-05-08T09:00:00.000Z'),
					workshopVenue: 'Virtual',
					workshopDate: new Date('2026-05-19T10:00:00')
				},
				documents: [
					{
						guid: 'report-guid',
						name: 'Gateway 2 report',
						documentSetId: DOCUMENT_SET_ID.G2_REPORT,
						createdAt: new Date('2026-05-08T09:00:00.000Z'),
						latestDocumentVersion: {
							originalFilename: 'gateway-2-report.pdf',
							fileName: 'stored-report.pdf',
							dateCreated: new Date('2026-05-08T09:00:00.000Z'),
							isDeleted: false
						}
					},
					{
						guid: 'workshop-guid',
						name: 'Workshop agenda',
						documentSetId: DOCUMENT_SET_ID.G2_WORKSHOP_DOCUMENTS,
						createdAt: new Date('2026-05-08T10:00:00.000Z'),
						latestDocumentVersion: {
							originalFilename: 'workshop-agenda.pdf',
							fileName: 'stored-workshop.pdf',
							dateCreated: new Date('2026-05-08T10:00:00.000Z'),
							isDeleted: false
						}
					}
				]
			}
		} as any;
		const res = { locals: {} } as any;

		req.currentCase.documents.push({
			...req.currentCase.documents[0],
			guid: 'draft-report-guid',
			isTemp: true
		});
		setGateway2CheckAnswersViewLocals(req, res);

		assert.deepStrictEqual(
			res.locals.gateway2ReportFiles.map((file: { fileName: string }) => file.fileName),
			['gateway-2-report.pdf']
		);
		assert.deepStrictEqual(
			res.locals.workshopDocuments.map((file: { fileName: string }) => file.fileName),
			['workshop-agenda.pdf']
		);
		assert.strictEqual(res.locals.hasWorkshop, true);
		assert.strictEqual(res.locals.workshopVenue, 'Virtual');
		assert.deepStrictEqual(res.locals.workShopStartTime, '10am, 19 May 2026');
	});

	it('flags a virus scan in progress when an uploaded document has not been scanned', () => {
		const req = {
			params: { planReference: 'PLAN-001' },
			currentCase: { planTitle: 'East Borough Local Plan' }
		} as any;
		const res = {
			locals: {
				journeyResponse: {
					answers: {
						gateway2CoverLetter: [{ fileName: 'cover-letter.pdf', virusCheckStatus: 'not_scanned' }]
					}
				}
			}
		} as any;

		setGateway2CheckAnswersViewLocals(req, res);

		assert.strictEqual(res.locals.virusScanInProgress, true);
		assert.strictEqual(res.locals.virusErrorSummary, undefined);
	});

	it('surfaces a virus detected error when an uploaded document is affected', () => {
		const req = {
			params: { planReference: 'PLAN-001' },
			currentCase: { planTitle: 'East Borough Local Plan' }
		} as any;
		const res = {
			locals: {
				journeyResponse: {
					answers: {
						gateway2CoverLetter: [{ fileName: 'bad.pdf', virusCheckStatus: 'affected' }]
					}
				}
			}
		} as any;

		setGateway2CheckAnswersViewLocals(req, res);

		assert.strictEqual(res.locals.virusScanInProgress, false);
		assert.strictEqual(res.locals.virusErrorSummary.length, 1);
		assert.match(res.locals.virusErrorSummary[0].text, /bad\.pdf contains a virus/);
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
		assert.ok(html.includes('Upload your Gateway 1 self assessment'));
		assert.ok(html.includes('Upload a file'));
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
		assert.ok(html.includes('Upload your consultation on proposed local plan content and evidence'));
		assert.ok(html.includes('Upload a file'));
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
			{
				fileName: 'gateway-2%20report.pdf',
				dateCreated: new Date('2026-05-08T12:00:00.000Z'),
				documentGuid: 'document-guid-1'
			}
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
			{
				fileName: 'gateway-2-report.pdf',
				documentGuid: ''
			}
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
									key: { text: 'Gateway 2 cover letter' },
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

	it('renders the issued Gateway 2 report metadata', () => {
		const nunjucks = configureNunjucks();
		const html = nunjucks.render('views/manage-local-plans/gateway-2-submission/check-your-answers-submitted.njk', {
			pageTitle: 'Gateway 2 submission',
			pageHeading: 'Gateway 2 submission',
			submissionDate: '1 September 2026',
			gateway2ReportFiles: [
				{
					fileName: 'gateway-2-report.pdf',
					href: '/manage-local-plans/PLAN-001/gateway-2-submission/download-document/report-guid',
					sharedDate: '24 September 2026'
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
		assert.ok(html.includes('gateway-2-report.pdf'));
		assert.ok(html.includes('(shared on 24 September 2026)'));
	});

	it('renders workshop details in the Gateway 2 report summary list', () => {
		const nunjucks = configureNunjucks();
		const html = nunjucks.render('views/manage-local-plans/gateway-2-submission/check-your-answers-submitted.njk', {
			pageTitle: 'Gateway 2 submission',
			pageHeading: 'Gateway 2 submission',
			submissionDate: '1 September 2026',
			gateway2ReportFiles: [
				{
					fileName: 'gateway-2-report.pdf',
					href: '/manage-local-plans/PLAN-001/gateway-2-submission/download-document/report-guid',
					sharedDate: '24 September 2026'
				}
			],
			hasWorkshop: true,
			workShopStartTime: '12:30, 11 November 2026',
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
		assert.match(html, /Start time(?:\s|<[^>]+>)*12:30, 11 November 2026/);
		assert.ok(!html.includes('data-cy="workshop-details-table"'));
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
									key: { text: 'Gateway 2 cover letter' },
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
		assert.doesNotMatch(html, /<button\b[^>]*>[\s\S]*?\bSubmit\b[\s\S]*?<\/button>/i, 'expected no submit button');
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
									key: { text: 'Gateway 2 cover letter' },
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

	it('sets workshop locals from the latest workshop', () => {
		const middleware = buildSubmittedGateway2View();
		const req = {
			currentCase: {
				submissionDate: new Date('2026-09-01T14:30:00Z'),
				email: 'user@example.com',
				gateway2Info: {
					workshops: [
						{
							createdDate: new Date('2026-09-01T09:00:00Z'),
							workshopDate: new Date('2026-10-01T12:00:00Z'),
							workshopTime: '09:30',
							workshopEndTime: '12:00',
							workshopVenueName: 'Old venue',
							workshopAddressLine: '1 Old Street',
							workshopAddressLine2: null,
							workshopTownOrCity: 'Oldtown',
							workshopPostcode: 'OL1 1AA'
						},
						{
							createdDate: new Date('2026-09-02T09:00:00Z'),
							workshopDate: new Date('2026-11-03T12:00:00Z'),
							workshopTime: '10:15',
							workshopEndTime: '15:45',
							workshopLocationType: 'hybrid',
							remoteMeetingLinkKnown: 'yes',
							remoteMeetingLink: 'https://teams.example.com/latest',
							workshopVenueName: 'Latest venue',
							workshopAddressLine: '1 Latest Street',
							workshopAddressLine2: null,
							workshopTownOrCity: 'Newtown',
							workshopPostcode: 'NW1 1AA'
						}
					]
				}
			}
		} as any;

		const locals: Record<string, unknown> = {
			journey: { taskListTemplate: 'original-template.njk' }
		};
		const res = { locals } as any;

		middleware(req, res, () => {});

		assert.strictEqual(locals.hasWorkshop, true);
		assert.strictEqual(locals.workshopFormat, 'hybrid');
		assert.deepStrictEqual(locals.workshopVenue, ['Latest venue', '1 Latest Street', 'Newtown', 'NW1 1AA']);
		assert.strictEqual(locals.workShopStartTime, '10:15am, 3 November 2026');
		assert.strictEqual(locals.workshopMeetingLink, 'https://teams.example.com/latest');
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

describe('Gateway 2 status tag', () => {
	function getStatusTag(currentCase?: Record<string, unknown>) {
		const req = {
			params: { planReference: 'PLAN-001' },
			currentCase
		} as any;

		const res = { locals: {} } as any;

		setGateway2CheckAnswersViewLocals(req, res);

		return res.locals.statusTag;
	}

	it('returns an empty string when there is no current case', () => {
		assert.strictEqual(getStatusTag(), '');
	});

	it('returns Ready to start when there are no documents or submission dates', () => {
		assert.deepStrictEqual(getStatusTag({}), StatusTag[STATUS.ReadyToStart]);
	});

	it('returns In progress when documents have been uploaded', () => {
		assert.deepStrictEqual(
			getStatusTag({
				documents: [{ guid: 'document-1' }]
			}),
			StatusTag[STATUS.InProgress]
		);
	});

	it('returns Under review when the case has a submission date', () => {
		assert.deepStrictEqual(
			getStatusTag({
				submissionDate: new Date('1999-07-21'),
				documents: [{ guid: 'document-1' }]
			}),
			StatusTag[STATUS.UnderReview]
		);
	});

	it('returns Completed when the Gateway 2 report has been issued', () => {
		assert.deepStrictEqual(
			getStatusTag({
				gateway2Info: {
					reportIssuedDate: new Date('2002-11-20')
				},
				submissionDate: new Date('2026-08-01'),
				documents: [{ guid: 'document-1' }]
			}),
			StatusTag[STATUS.Completed]
		);
	});
});
