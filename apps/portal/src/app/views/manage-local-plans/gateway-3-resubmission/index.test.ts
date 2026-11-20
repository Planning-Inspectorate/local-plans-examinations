import assert from 'node:assert';
import { describe, it } from 'node:test';
import { gateway3ResubmissionRoutes } from './index.ts';
import { configureNunjucks } from '../../../nunjucks.ts';
import { STATUS, StatusTag } from '../../../types.ts';

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

describe('Gateway 3 resubmission declaration page', () => {
	function renderDeclaration(overrides = {}) {
		const nunjucks = configureNunjucks();
		return nunjucks.render('views/manage-local-plans/gateway-3-resubmission/declaration.njk', {
			pageTitle: "Are you sure you're ready to submit?",
			pageHeading: "Are you sure you're ready to submit?",
			goBackUrl: '/manage-local-plans/PLAN-001/gateway-3-resubmission',
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

	it('renders the heading', () => {
		const html = renderDeclaration();
		assert.ok(html.includes('Are you sure you&#39;re ready to submit?'), 'expected heading');
	});

	it('renders the warning copy', () => {
		const html = renderDeclaration();
		assert.ok(
			html.includes("This can't be undone.") || html.includes('This can&#39;t be undone.'),
			'expected warning copy'
		);
	});

	it('renders the green submit button with correct text', () => {
		const html = renderDeclaration();
		assert.ok(html.includes('Yes, send my submission'), 'expected submit button text');
	});

	it('renders the no go back link', () => {
		const html = renderDeclaration();
		assert.ok(html.includes('No, go back'), 'expected no go back link');
		assert.ok(html.includes('/manage-local-plans/PLAN-001/gateway-3-resubmission'), 'expected go back URL');
	});
});

describe('Gateway 3 resubmission submission complete page', () => {
	function renderSubmissionComplete(overrides = {}) {
		const nunjucks = configureNunjucks();
		return nunjucks.render('views/manage-local-plans/gateway-3-resubmission/submission-complete.njk', {
			pageTitle: 'Gateway 3 submission complete',
			planOverviewUrl: '/manage-local-plans/PLAN-001',
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			},
			...overrides
		});
	}

	it('renders the panel with correct title', () => {
		const html = renderSubmissionComplete();
		assert.ok(html.includes('Gateway 3 submission complete'), 'expected panel title');
		assert.ok(html.includes('govuk-panel'), 'expected panel component');
	});

	it('renders confirmation email copy', () => {
		const html = renderSubmissionComplete();
		assert.ok(
			html.includes("We've sent you a confirmation email.") ||
				html.includes('We&#39;ve sent you a confirmation email.'),
			'expected confirmation email copy'
		);
	});

	it('renders what happens next heading and bullet points', () => {
		const html = renderSubmissionComplete();
		assert.ok(html.includes('What happens next'), 'expected what happens next heading');
		assert.ok(html.includes('Your case officer will assign an assessor to your case'), 'expected first bullet');
		assert.ok(html.includes('The assessor will review your submission'), 'expected second bullet');
		assert.ok(html.includes('check your submission status'), 'expected third bullet link text');
	});

	it('renders the check submission status link to plan overview', () => {
		const html = renderSubmissionComplete();
		assert.ok(html.includes('href="/manage-local-plans/PLAN-001"'), 'expected plan overview URL');
	});
});

describe('Gateway 3 submitted resubmission page template (under review / complete)', () => {
	const config = {
		styleFile: 'style.css',
		headerTitle: 'Submit your plan for examination',
		footerLinks: [],
		primaryNavigationLinks: []
	};

	function renderSubmitted(overrides = {}) {
		const nunjucks = configureNunjucks();
		return nunjucks.render('views/manage-local-plans/gateway-3-resubmission/resubmission-submitted.njk', {
			pageCaption: 'East Borough local plan',
			submissionNumber: 3,
			statusTag: StatusTag[STATUS.UnderReview],
			reports: [
				{
					submissionNumber: 2,
					issuedDate: '13 Jul 2026',
					files: [{ fileName: 'report-2.pdf', downloadUrl: '/download/report-2' }]
				},
				{
					submissionNumber: 1,
					issuedDate: '25 Jun 2026',
					files: [{ fileName: 'report-1.pdf', downloadUrl: '/download/report-1' }]
				}
			],
			previousSubmissions: [
				{
					submissionNumber: 2,
					submittedDate: '1 Jul 2026',
					url: '/manage-local-plans/PLAN-001/gateway-3-resubmission/submission/2'
				},
				{
					submissionNumber: 1,
					submittedDate: '20 Jun 2026',
					url: '/manage-local-plans/PLAN-001/gateway-3-resubmission/submission/1'
				}
			],
			currentSubmissionDate: '20 July 2026',
			submitter: 'lpa@example.com',
			newDocuments: [
				{ fileName: 'new-document-1.pdf', downloadUrl: '/download/new-1' },
				{ fileName: 'new-document-2.pdf', downloadUrl: '/download/new-2' }
			],
			backLinkUrl: '/manage-local-plans/PLAN-001',
			config,
			...overrides
		});
	}

	function newDocumentsSection(html: string) {
		return html.slice(html.indexOf('data-cy="new-documents-table"'));
	}

	it('renders the h1 with submission number and plan caption', () => {
		const html = renderSubmitted();
		assert.ok(html.includes('Gateway 3, submission 3'), 'expected heading with submission number');
		assert.ok(html.includes('East Borough local plan'), 'expected plan caption');
	});

	it('renders the yellow under review tag', () => {
		const html = renderSubmitted();
		assert.ok(
			html.includes('<strong class="govuk-tag govuk-tag--yellow" data-cy="status-tag">Under review</strong>'),
			'expected yellow under review tag'
		);
	});

	it('renders the completed tag when gateway 3 is complete', () => {
		const html = renderSubmitted({ statusTag: StatusTag[STATUS.Completed] });
		assert.ok(html.includes('data-cy="status-tag">Completed</strong>'), 'expected completed tag');
		assert.ok(!html.includes('Under review'), 'should not show under review');
	});

	it('renders report rows with a View report link and issued date, newest first', () => {
		const html = renderSubmitted();
		assert.ok(html.includes('Submission 2 report</dt>'), 'expected submission 2 report row');
		assert.ok(html.includes('Submission 1 report</dt>'), 'expected submission 1 report row');
		assert.ok(html.includes('href="/download/report-2"'), 'expected report download link');
		assert.ok(html.includes('>View report</a>'), 'expected View report link text');
		assert.ok(html.includes('(issued 13 Jul 2026)'), 'expected issued date');
		assert.ok(
			html.indexOf('Submission 2 report</dt>') < html.indexOf('Submission 1 report</dt>'),
			'expected reports in descending order'
		);
	});

	it('renders each file name when a report has more than one file', () => {
		const html = renderSubmitted({
			reports: [
				{
					submissionNumber: 1,
					issuedDate: '25 Jun 2026',
					files: [
						{ fileName: 'report-1.pdf', downloadUrl: '/download/report-1' },
						{ fileName: 'report-1-annex.pdf', downloadUrl: '/download/report-1-annex' }
					]
				}
			]
		});
		assert.ok(html.includes('report-1.pdf'), 'expected first report file');
		assert.ok(html.includes('report-1-annex.pdf'), 'expected second report file');
		assert.ok(!html.includes('>View report</a>'), 'should list file names instead of View report');
	});

	it('renders previous submission rows under the reports, newest first', () => {
		const html = renderSubmitted();
		assert.ok(html.includes('Submission 2</dt>'), 'expected submission 2 row');
		assert.ok(html.includes('Submission 1</dt>'), 'expected submission 1 row');
		assert.ok(html.includes('View all documents'), 'expected View all documents link');
		assert.ok(
			html.includes('href="/manage-local-plans/PLAN-001/gateway-3-resubmission/submission/2"'),
			'expected link to submission 2'
		);
		assert.ok(html.includes('(submitted 1 Jul 2026)'), 'expected submitted date');
		assert.ok(
			html.indexOf('Submission 1 report</dt>') < html.indexOf('Submission 2</dt>'),
			'expected submissions after reports'
		);
		assert.ok(
			html.indexOf('Submission 2</dt>') < html.indexOf('Submission 1</dt>'),
			'expected submissions in descending order'
		);
	});

	it('does not render the reports and submissions list when both are empty', () => {
		const html = renderSubmitted({ reports: [], previousSubmissions: [] });
		assert.ok(!html.includes('data-cy="previous-submissions-table"'), 'should not render the list');
	});

	it('renders the latest submission copy below the section break', () => {
		const html = renderSubmitted();
		assert.ok(
			html.includes('Gateway 3, submission 3: 20 July 2026 by lpa@example.com'),
			'expected latest submission copy'
		);
		assert.ok(
			html.indexOf('govuk-section-break--visible') < html.indexOf('data-cy="current-submission-copy"'),
			'expected copy after the break line'
		);
	});

	it('renders the new or updated documents as bullet points when there is more than one', () => {
		const html = renderSubmitted();
		const section = newDocumentsSection(html);
		assert.ok(html.includes('New or updated documents'), 'expected h2');
		assert.ok(section.includes('Documents</dt>'), 'expected Documents row heading');
		assert.ok(section.includes('govuk-list--bullet'), 'expected bullet list');
		assert.ok(section.includes('href="/download/new-1"'), 'expected first document link');
		assert.ok(section.includes('new-document-2.pdf'), 'expected second document');
	});

	it('renders a single document as a link without bullet points', () => {
		const html = renderSubmitted({
			newDocuments: [{ fileName: 'only-document.pdf', downloadUrl: '/download/only' }]
		});
		const section = newDocumentsSection(html);
		assert.ok(section.includes('href="/download/only"'), 'expected document link');
		assert.ok(!section.includes('govuk-list--bullet'), 'should not use a bullet list');
	});

	it('does not render any editing controls', () => {
		const html = renderSubmitted();
		assert.ok(!html.includes('data-cy="add-documents"'), 'should not render Add/Change');
		assert.ok(!html.includes('data-cy="submit-resubmission"'), 'should not render Submit');
		assert.ok(!html.includes('Save and come back later'), 'should not render save link');
		assert.ok(!html.includes('Resubmission required'), 'should not render resubmission required tag');
	});
});

describe('Gateway 3 previous submission page template - status tag', () => {
	it('renders the status tag passed by the controller', () => {
		const nunjucks = configureNunjucks();
		const html = nunjucks.render('views/manage-local-plans/gateway-3-resubmission/previous-submission.njk', {
			pageCaption: 'East Borough Local Plan',
			submissionNumber: 2,
			reportSubmissionNumber: 2,
			isInitialSubmission: false,
			statusTag: StatusTag[STATUS.UnderReview],
			reportDocuments: [],
			previousSubmissions: [],
			submissionDate: '1 July 2026',
			documentSections: [],
			resubmissionDocuments: [],
			backLinkUrl: '/manage-local-plans/PLAN-001/gateway-3-resubmission',
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			}
		});
		assert.ok(html.includes('data-cy="status-tag">Under review</strong>'), 'expected under review tag');
		assert.ok(!html.includes('Resubmission required'), 'should not show resubmission required');
	});
});
