import assert from 'node:assert';
import { describe, it } from 'node:test';
import { gateway3ResubmissionRoutes } from './index.ts';
import { configureNunjucks } from '../../../nunjucks.ts';

describe('gateway3ResubmissionRoutes', () => {
	it('returns an express router with get, post and use methods', () => {
		const mockService = {
			createFileStorage: () => ({})
		} as any;
		const router = gateway3ResubmissionRoutes(mockService);
		assert.strictEqual(typeof router.get, 'function');
		assert.strictEqual(typeof router.post, 'function');
		assert.strictEqual(typeof router.use, 'function');
	});
});

describe('Gateway 3 resubmission page', () => {
	function renderResubmission(overrides = {}) {
		const nunjucks = configureNunjucks();
		return nunjucks.render('views/manage-local-plans/gateway-3-resubmission/resubmission.njk', {
			pageCaption: 'East Borough Local Plan',
			submissionNumber: 2,
			reportDocuments: [
				{
					fileName: 'gateway-3-report.pdf',
					downloadUrl: '/manage-local-plans/PLAN-001/gateway-3-resubmission/download-document/abc123',
					dateIssued: '15 October 2026'
				}
			],
			previousSubmissions: [{ number: 1, submittedDate: '1 October 2026' }],
			uploadedDocuments: [],
			addDocumentsUrl: '/manage-local-plans/PLAN-001/gateway-3-resubmission/additional-documents',
			saveAndComeBackUrl: '/manage-local-plans/PLAN-001',
			backLinkUrl: '/manage-local-plans/PLAN-001',
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			},
			...overrides
		});
	}

	it('renders the page heading with submission number and plan caption', () => {
		const html = renderResubmission();
		assert.ok(html.includes('Gateway 3 submission 2'), 'expected heading with submission number');
		assert.ok(html.includes('East Borough Local Plan'), 'expected plan caption');
	});

	it('renders the resubmission required status tag', () => {
		const html = renderResubmission();
		assert.ok(html.includes('Resubmission required'), 'expected resubmission required tag');
		assert.ok(html.includes('govuk-tag--red'), 'expected red tag class');
	});

	it('renders the submission report with download link and shared date', () => {
		const html = renderResubmission();
		assert.ok(html.includes('Submission 1 report'), 'expected report row heading with previous submission count');
		assert.ok(html.includes('gateway-3-report.pdf'), 'expected report filename');
		assert.ok(html.includes('shared on 15 October 2026'), 'expected shared on date');
	});

	it('renders multiple report documents as bullet points', () => {
		const html = renderResubmission({
			reportDocuments: [
				{ fileName: 'report-doc1.pdf', downloadUrl: '#1', dateIssued: '15 October 2026' },
				{ fileName: 'report-doc2.jpg', downloadUrl: '#2', dateIssued: '15 October 2026' },
				{ fileName: 'report-doc3.docx', downloadUrl: '#3', dateIssued: '15 October 2026' }
			]
		});
		assert.ok(html.includes('govuk-list--bullet'), 'expected bullet list for multiple reports');
		assert.ok(html.includes('report-doc1.pdf'), 'expected first report doc');
		assert.ok(html.includes('report-doc2.jpg'), 'expected second report doc');
		assert.ok(html.includes('report-doc3.docx'), 'expected third report doc');
	});

	it('renders previous submissions with submitted date', () => {
		const html = renderResubmission();
		assert.ok(html.includes('Previous submissions'), 'expected previous submissions heading');
		assert.ok(html.includes('Submission 1'), 'expected submission 1');
		assert.ok(html.includes('submitted on 1 October 2026'), 'expected submitted date');
	});

	it('renders the save and come back later link', () => {
		const html = renderResubmission();
		assert.ok(html.includes('Save and come back later'), 'expected save link');
		assert.ok(html.includes('data-cy="save-and-come-back"'), 'expected save data-cy');
	});

	it('renders the new or updated documents section heading and copy', () => {
		const html = renderResubmission();
		assert.ok(html.includes('New or updated documents'), 'expected new documents heading');
		assert.ok(
			html.includes(
				'Add any new documents or updated documents that are relevant to your resubmission as outlined in the report'
			),
			'expected documents copy'
		);
	});

	it('renders Not added status and Add CTA when no documents uploaded', () => {
		const html = renderResubmission();
		assert.ok(html.includes('Not added'), 'expected Not added status');
		assert.ok(html.includes('data-cy="add-documents"'), 'expected add documents CTA');
		assert.ok(html.includes('Add'), 'expected Add text');
	});

	it('renders uploaded documents as links with Change CTA', () => {
		const html = renderResubmission({
			uploadedDocuments: [
				{
					fileName: 'updated-plan.pdf',
					downloadUrl: '/manage-local-plans/PLAN-001/gateway-3-resubmission/download-document/xyz'
				}
			]
		});
		assert.ok(html.includes('updated-plan.pdf'), 'expected uploaded filename');
		assert.ok(html.includes('Change'), 'expected Change CTA');
		assert.ok(!html.includes('Not added'), 'should not show Not added');
	});

	it('renders multiple uploaded documents as bullet points', () => {
		const html = renderResubmission({
			uploadedDocuments: [
				{ fileName: 'doc1.pdf', downloadUrl: '#' },
				{ fileName: 'doc2.pdf', downloadUrl: '#' }
			]
		});
		assert.ok(html.includes('govuk-list--bullet'), 'expected bullet list');
		assert.ok(html.includes('doc1.pdf'), 'expected first doc');
		assert.ok(html.includes('doc2.pdf'), 'expected second doc');
	});

	it('renders the green submit button', () => {
		const html = renderResubmission();
		assert.ok(html.includes('data-cy="submit-resubmission"'), 'expected submit button data-cy');
		assert.ok(html.includes('Submit'), 'expected Submit text');
	});

	it('renders back link to plan details page', () => {
		const html = renderResubmission();
		assert.ok(html.includes('/manage-local-plans/PLAN-001'), 'expected back link to plan page');
	});

	it('renders error summary when present', () => {
		const html = renderResubmission({
			errorSummary: [{ text: 'Add any new or updated documents before submitting', href: '#new-documents-heading' }]
		});
		assert.ok(html.includes('There is a problem'), 'expected error summary title');
		assert.ok(html.includes('Add any new or updated documents before submitting'), 'expected error message');
	});
});

describe('Gateway 3 previous submission page template', () => {
	function renderPreviousSubmission(overrides = {}) {
		const nunjucks = configureNunjucks();
		return nunjucks.render('views/manage-local-plans/gateway-3-resubmission/previous-submission.njk', {
			pageCaption: 'East Borough Local Plan',
			submissionNumber: 1,
			reportSubmissionNumber: 1,
			isInitialSubmission: true,
			reportDocuments: [
				{
					fileName: 'GW3Report.pdf',
					downloadUrl: '/manage-local-plans/PLAN-001/gateway-3-resubmission/download-document/report-guid',
					dateIssued: '15 October 2026'
				}
			],
			previousSubmissions: [],
			submissionDate: '1 October 2026',
			submissionTime: '12:00',
			submitter: 'lpa@example.com',
			documentSections: [
				{
					heading: 'Required information',
					documents: [
						{
							title: 'Proposed local plan',
							files: [{ fileName: 'plan.pdf', downloadUrl: '/download/plan' }]
						}
					]
				},
				{
					heading: 'Optional documents',
					documents: [
						{
							title: 'Other documents',
							files: []
						}
					]
				}
			],
			resubmissionDocuments: [],
			backLinkUrl: '/manage-local-plans/PLAN-001/gateway-3-resubmission',
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			},
			...overrides
		});
	}

	it('renders the page heading with submission number and plan caption', () => {
		const html = renderPreviousSubmission();
		assert.ok(html.includes('Gateway 3; submission 1'), 'expected heading with submission 1');
		assert.ok(html.includes('East Borough Local Plan'), 'expected plan caption');
	});

	it('renders the resubmission required status tag', () => {
		const html = renderPreviousSubmission();
		assert.ok(html.includes('Resubmission required'), 'expected status tag');
		assert.ok(html.includes('govuk-tag--red'), 'expected red tag');
	});

	it('renders the report document with issued date for submission 1', () => {
		const html = renderPreviousSubmission();
		assert.ok(html.includes('Submission 1 report'), 'expected report heading');
		assert.ok(html.includes('GW3Report.pdf'), 'expected report filename');
		assert.ok(html.includes('issued 15 October 2026'), 'expected issued date');
	});

	it('renders submission metadata copy', () => {
		const html = renderPreviousSubmission();
		assert.ok(html.includes('Your submission was sent on 1 October 2026'), 'expected submission date');
		assert.ok(html.includes('at 12:00'), 'expected submission time');
		assert.ok(html.includes('by lpa@example.com'), 'expected submitter');
	});

	it('renders required information section with document links', () => {
		const html = renderPreviousSubmission();
		assert.ok(html.includes('Required information'), 'expected required heading');
		assert.ok(html.includes('Proposed local plan'), 'expected document title');
		assert.ok(html.includes('plan.pdf'), 'expected document filename');
	});

	it('renders optional documents section', () => {
		const html = renderPreviousSubmission();
		assert.ok(html.includes('Optional documents'), 'expected optional heading');
	});

	it('does not render previous submissions section when there are none', () => {
		const html = renderPreviousSubmission();
		assert.ok(!html.includes('Previous submissions'), 'should not have previous submissions');
	});

	it('does not render Change or Add actions', () => {
		const html = renderPreviousSubmission();
		assert.ok(!html.includes('>Change<'), 'should not have Change action');
		assert.ok(!html.includes('>Add<'), 'should not have Add action');
	});

	it('renders submission 2 with previous submissions and report docs', () => {
		const html = renderPreviousSubmission({
			submissionNumber: 2,
			reportSubmissionNumber: 2,
			isInitialSubmission: false,
			previousSubmissions: [
				{
					number: 1,
					submittedDate: '1 October 2026',
					url: '/manage-local-plans/PLAN-001/gateway-3-resubmission/submission/1'
				}
			],
			documentSections: [],
			resubmissionDocuments: []
		});
		assert.ok(html.includes('Gateway 3; submission 2'), 'expected heading with submission 2');
		assert.ok(html.includes('Previous submissions'), 'expected previous submissions');
		assert.ok(html.includes('Submission 1'), 'expected submission 1 link');
		assert.ok(html.includes('submitted on 1 October 2026'), 'expected submitted date');
		assert.ok(html.includes('Submission 2 report'), 'expected submission 2 report label');
		assert.ok(html.includes('shared on 15 October 2026'), 'expected shared on wording for resubmission');
		assert.ok(!html.includes('issued 15 October 2026'), 'should not use issued wording for resubmission');
		assert.ok(!html.includes('New or updated documents'), 'should not show new documents section when empty');
	});

	it('renders multiple documents as bullet points', () => {
		const html = renderPreviousSubmission({
			documentSections: [
				{
					heading: 'Required information',
					documents: [
						{
							title: 'Multi-doc field',
							files: [
								{ fileName: 'doc1.pdf', downloadUrl: '#1' },
								{ fileName: 'doc2.pdf', downloadUrl: '#2' }
							]
						}
					]
				}
			]
		});
		assert.ok(html.includes('govuk-list--bullet'), 'expected bullet list');
		assert.ok(html.includes('doc1.pdf'), 'expected first doc');
		assert.ok(html.includes('doc2.pdf'), 'expected second doc');
	});

	it('renders back link to resubmission page', () => {
		const html = renderPreviousSubmission();
		assert.ok(html.includes('/manage-local-plans/PLAN-001/gateway-3-resubmission'), 'expected back URL');
	});
});

describe('Gateway 3 resubmission page - clickable submission links', () => {
	function renderResubmissionWithLinks() {
		const nunjucks = configureNunjucks();
		return nunjucks.render('views/manage-local-plans/gateway-3-resubmission/resubmission.njk', {
			pageCaption: 'Test Plan',
			submissionNumber: 3,
			reportDocument: null,
			previousSubmissions: [
				{
					number: 1,
					submittedDate: '1 October 2026',
					url: '/manage-local-plans/PLAN-001/gateway-3-resubmission/submission/1'
				},
				{
					number: 2,
					submittedDate: '20 October 2026',
					url: '/manage-local-plans/PLAN-001/gateway-3-resubmission/submission/2'
				}
			],
			uploadedDocuments: [],
			addDocumentsUrl: '/manage-local-plans/PLAN-001/gateway-3-resubmission/additional-documents',
			saveAndComeBackUrl: '/manage-local-plans/PLAN-001',
			backLinkUrl: '/manage-local-plans/PLAN-001',
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			}
		});
	}

	it('renders previous submissions as clickable links', () => {
		const html = renderResubmissionWithLinks();
		assert.ok(
			html.includes('href="/manage-local-plans/PLAN-001/gateway-3-resubmission/submission/1"'),
			'expected link to submission 1'
		);
		assert.ok(
			html.includes('href="/manage-local-plans/PLAN-001/gateway-3-resubmission/submission/2"'),
			'expected link to submission 2'
		);
		assert.ok(html.includes('Submission 1'), 'expected submission 1 text');
		assert.ok(html.includes('Submission 2'), 'expected submission 2 text');
	});
});

describe('Gateway 3 upload documents page (reusable file-uploader template)', () => {
	const resubmissionQuestion = {
		fieldName: 'resubmissionDocuments',
		question: 'Upload any new or updated documents',
		type: 'file-uploader',
		editable: true,
		multiple: true,
		maxFileSizeBytes: 250 * 1024 * 1024,
		maxFileSizeLabel: '250MB',
		allowedFileExtensions: [
			'pdf',
			'doc',
			'docx',
			'ppt',
			'pptx',
			'xls',
			'xlsx',
			'msg',
			'jpg',
			'jpeg',
			'png',
			'tif',
			'tiff'
		],
		allowedMimeTypes: [
			'application/pdf',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
		],
		text: {
			caption: 'Additional documents',
			fileRequirementsText:
				'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB. The total size of your uploaded files must be smaller than 1GB.',
			chooseFilesButtonText: 'Choose files',
			dropInstructionText: 'or drop files',
			continueButtonText: 'Save and return'
		}
	};

	function renderUpload(overrides = {}) {
		const nunjucks = configureNunjucks();
		return nunjucks.render('forms/custom-components/file-uploader/index.njk', {
			layoutTemplate: 'views/layouts/main.njk',
			question: resubmissionQuestion,
			backLink: '/manage-local-plans/PLAN-001/gateway-3-resubmission',
			currentUrl: '/manage-local-plans/PLAN-001/gateway-3-resubmission/additional-documents',
			uploadedFiles: [],
			uploadedFilesEncoded: Buffer.from(JSON.stringify([]), 'utf-8').toString('base64'),
			errors: {},
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			},
			...overrides
		});
	}

	it('renders the page heading with caption', () => {
		const html = renderUpload();
		assert.ok(html.includes('Upload any new or updated documents'), 'expected page heading');
		assert.ok(html.includes('Additional documents'), 'expected caption');
	});

	it('renders the file requirements hint text', () => {
		const html = renderUpload();
		assert.ok(
			html.includes('Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF'),
			'expected hint text'
		);
	});

	it('renders the upload selected files button', () => {
		const html = renderUpload();
		assert.ok(html.includes('Upload selected files'), 'expected upload button');
	});

	it('renders the save and return button', () => {
		const html = renderUpload();
		assert.ok(html.includes('Save and return'), 'expected save and return button');
		assert.ok(html.includes('data-cy="save-and-return-button"'), 'expected save and return data-cy');
	});

	it('renders the back link to resubmission page', () => {
		const html = renderUpload();
		assert.ok(
			html.includes('/manage-local-plans/PLAN-001/gateway-3-resubmission'),
			'expected back link to resubmission page'
		);
	});

	it('renders uploaded files when present', () => {
		const html = renderUpload({
			uploadedFiles: [{ id: '1', fileName: 'test.pdf' }],
			uploadedFilesEncoded: Buffer.from(JSON.stringify([{ id: '1', fileName: 'test.pdf' }]), 'utf-8').toString('base64')
		});
		assert.ok(html.includes('test.pdf'), 'expected uploaded filename');
	});

	it('renders the upload form action pointing to upload-documents', () => {
		const html = renderUpload();
		assert.ok(
			html.includes('/manage-local-plans/PLAN-001/gateway-3-resubmission/additional-documents/upload-documents'),
			'expected upload form action'
		);
	});
});
