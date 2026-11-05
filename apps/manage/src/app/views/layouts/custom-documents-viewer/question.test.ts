import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import CustomDocumentsQuestion from './question.ts';
import { configureNunjucks } from '../../../nunjucks.ts';
import {
	DOCUMENT_LABELS,
	OPTIONAL_DOCUMENT_SETS,
	REQUIRED_DOCUMENT_SETS
} from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';

const REFERENCE = 'PLAN-123456';
const SUBMISSION_ID = '1';
const SUBMISSION_SECTION = `gateway-3-submission-${SUBMISSION_ID}`;
const SUBMISSION_URL = `/case/${REFERENCE}/gateway-3/${SUBMISSION_SECTION}`;
const EXAMINATION_WEBSITE = 'https://example.com/examination';
const NOT_PROVIDED = 'Not provided';

const requiredDocumentFields = Object.keys(REQUIRED_DOCUMENT_SETS);
const optionalDocumentFields = Object.keys(OPTIONAL_DOCUMENT_SETS);

const baseParams = {
	title: 'Documents',
	question: 'Gateway 3 documents',
	fieldName: `gateway3DocumentSubmission-${SUBMISSION_ID}`,
	url: `gateway-3-review-documents-${SUBMISSION_ID}`
};

const buildQuestion = () => {
	const question = new CustomDocumentsQuestion(baseParams);
	question.getAction = () => ({ href: '/review', text: 'Review', visuallyHiddenText: 'Documents' });
	return question;
};

const withoutDocuments = (fields: string[]) => Object.fromEntries(fields.map((field) => [field, '']));

const buildAnswers = ({
	optionalData = {},
	...requiredOverrides
}: Record<string, unknown> & { optionalData?: Record<string, string> } = {}) => ({
	...withoutDocuments(requiredDocumentFields),
	examinationWebsite: null,
	...requiredOverrides,
	optionalData: { ...withoutDocuments(optionalDocumentFields), ...optionalData }
});

const buildJourney = (answers: Record<string, unknown>) => ({
	response: { answers },
	journeyTemplate: 'test-template',
	taskListUrl: '/task-list',
	journeyTitle: 'Journey',
	getBackLink: () => '/back'
});

const buildViewModelOptions = (answers: Record<string, unknown>) => ({
	section: { name: 'Gateway 3 submission', segment: SUBMISSION_SECTION },
	journey: buildJourney(answers),
	params: { reference: REFERENCE, section: SUBMISSION_SECTION }
});

const reviewDocumentsHref = `${SUBMISSION_URL}/gateway-3-review-documents-${SUBMISSION_ID}`;
const downloadUrl = (guid: string) => `/case/${REFERENCE}/download-case-document/${guid}`;

describe('CustomDocumentsQuestion', () => {
	describe('formatAnswerForSummary', () => {
		it('should count required, optional and examination website documents', () => {
			const question = buildQuestion();
			const answers = buildAnswers({
				proposedLocalPlan: 'plan.pdf, plan-appendix.pdf',
				mapOfPolicies: 'map.pdf',
				examinationWebsite: EXAMINATION_WEBSITE,
				optionalData: { otherDocuments: 'other.pdf' }
			});

			const summary = question.formatAnswerForSummary(SUBMISSION_SECTION, buildJourney(answers) as any);

			assert.deepEqual(summary, [
				{
					key: 'Documents',
					value: '5 document(s)',
					action: { href: '/review', text: 'Review', visuallyHiddenText: 'Documents' }
				}
			]);
		});

		it('should show zero documents when nothing has been added', () => {
			const question = buildQuestion();

			const [summaryRow] = question.formatAnswerForSummary(SUBMISSION_SECTION, buildJourney(buildAnswers()) as any);

			assert.equal(summaryRow.value, '0 document(s)');
		});
	});

	describe('setActionLink', () => {
		it('should link to the submission review documents page with Review text when documents have been added', () => {
			const question = buildQuestion();

			question.setActionLink(SUBMISSION_ID, REFERENCE, buildAnswers({ proposedLocalPlan: 'plan.pdf' }));

			assert.deepEqual(question.actionLink, { href: reviewDocumentsHref, text: 'Review' });
		});

		it('should leave the action text empty when no documents have been added', () => {
			const question = buildQuestion();

			question.setActionLink(SUBMISSION_ID, REFERENCE, buildAnswers());

			assert.deepEqual(question.actionLink, { href: reviewDocumentsHref, text: '' });
		});
	});

	describe('toViewModel', () => {
		it('should list the examination website first, then each required document by label', () => {
			const question = buildQuestion();
			const answers = buildAnswers({ proposedLocalPlan: 'plan.pdf', examinationWebsite: EXAMINATION_WEBSITE });

			const viewModel = question.toViewModel(buildViewModelOptions(answers));

			assert.deepEqual(
				Object.keys(viewModel.rowsMapRequiredData),
				['examinationWebsite', ...requiredDocumentFields].map((field) => DOCUMENT_LABELS[field])
			);
			assert.equal(viewModel.rowsMapRequiredData[DOCUMENT_LABELS.examinationWebsite], EXAMINATION_WEBSITE);
			assert.equal(viewModel.rowsMapRequiredData[DOCUMENT_LABELS.proposedLocalPlan], 'plan.pdf');
			assert.equal(viewModel.rowsMapRequiredData[DOCUMENT_LABELS.mapOfPolicies], NOT_PROVIDED);
		});

		it('should list each optional document by label and mark blank ones as not added', () => {
			const question = buildQuestion();
			const answers = buildAnswers({ optionalData: { environmentalReport: 'environmental-report.pdf' } });

			const viewModel = question.toViewModel(buildViewModelOptions(answers));

			assert.deepEqual(
				Object.keys(viewModel.optionDataMap),
				optionalDocumentFields.map((field) => DOCUMENT_LABELS[field])
			);
			assert.equal(viewModel.optionDataMap[DOCUMENT_LABELS.environmentalReport], 'environmental-report.pdf');
			assert.equal(viewModel.optionDataMap[DOCUMENT_LABELS.otherDocuments], NOT_PROVIDED);
		});

		it('should point Issue decision at the decision for the submission being reviewed', () => {
			const question = buildQuestion();

			const viewModel = question.toViewModel(buildViewModelOptions(buildAnswers()));

			assert.equal(viewModel.issueDecisionUrl, `${SUBMISSION_URL}/gateway-3-decision-${SUBMISSION_ID}`);
		});

		it('should set the Review action link for the submission being reviewed', () => {
			const question = buildQuestion();

			question.toViewModel(buildViewModelOptions(buildAnswers({ statementOfCompliance: 'compliance.pdf' })));

			assert.deepEqual(question.actionLink, { href: reviewDocumentsHref, text: 'Review' });
		});

		it('should build a download link for each required document file, keyed by label', () => {
			const question = buildQuestion();
			const answers = buildAnswers({
				proposedLocalPlan: 'plan.pdf, plan-appendix.pdf',
				documentFiles: {
					proposedLocalPlan: [
						{ guid: 'plan-guid', fileName: 'plan.pdf' },
						{ guid: 'appendix-guid', fileName: 'plan-appendix.pdf' }
					]
				}
			});

			const viewModel = question.toViewModel(buildViewModelOptions(answers));

			assert.deepEqual(
				Object.keys(viewModel.requiredDocumentFiles),
				requiredDocumentFields.map((field) => DOCUMENT_LABELS[field])
			);
			assert.deepEqual(viewModel.requiredDocumentFiles[DOCUMENT_LABELS.proposedLocalPlan], [
				{ fileName: 'plan.pdf', downloadUrl: downloadUrl('plan-guid') },
				{ fileName: 'plan-appendix.pdf', downloadUrl: downloadUrl('appendix-guid') }
			]);
			assert.deepEqual(viewModel.requiredDocumentFiles[DOCUMENT_LABELS.mapOfPolicies], []);
		});

		it('should build a download link for each optional document file, keyed by label', () => {
			const question = buildQuestion();
			const answers = buildAnswers({
				optionalData: { environmentalReport: 'environmental-report.pdf' },
				documentFiles: { environmentalReport: [{ guid: 'environmental-guid', fileName: 'environmental-report.pdf' }] }
			});

			const viewModel = question.toViewModel(buildViewModelOptions(answers));

			assert.deepEqual(
				Object.keys(viewModel.optionalDocumentFiles),
				optionalDocumentFields.map((field) => DOCUMENT_LABELS[field])
			);
			assert.deepEqual(viewModel.optionalDocumentFiles[DOCUMENT_LABELS.environmentalReport], [
				{ fileName: 'environmental-report.pdf', downloadUrl: downloadUrl('environmental-guid') }
			]);
			assert.deepEqual(viewModel.optionalDocumentFiles[DOCUMENT_LABELS.otherDocuments], []);
		});

		it('should encode the case reference and document guid in download links', () => {
			const question = buildQuestion();
			const answers = buildAnswers({
				documentFiles: { statementOfCompliance: [{ guid: 'guid with/slash', fileName: 'compliance.pdf' }] }
			});
			const options = buildViewModelOptions(answers);
			options.params.reference = 'PLAN 1/2';

			const viewModel = question.toViewModel(options);

			assert.equal(
				viewModel.requiredDocumentFiles[DOCUMENT_LABELS.statementOfCompliance][0].downloadUrl,
				'/case/PLAN%201%2F2/download-case-document/guid%20with%2Fslash'
			);
		});

		it('should give every document an empty file list when no document files have been compiled', () => {
			const question = buildQuestion();

			const viewModel = question.toViewModel(buildViewModelOptions(buildAnswers()));

			assert.ok(Object.values(viewModel.requiredDocumentFiles).every((files: any) => files.length === 0));
			assert.ok(Object.values(viewModel.optionalDocumentFiles).every((files: any) => files.length === 0));
		});

		it('should link to the examination website as entered when it has a scheme', () => {
			const question = buildQuestion();

			const viewModel = question.toViewModel(
				buildViewModelOptions(buildAnswers({ examinationWebsite: EXAMINATION_WEBSITE }))
			);

			assert.deepEqual(viewModel.examinationWebsiteLink, {
				label: DOCUMENT_LABELS.examinationWebsite,
				text: EXAMINATION_WEBSITE,
				href: EXAMINATION_WEBSITE
			});
		});

		it('should prepend https:// to the examination website link when it has no scheme', () => {
			const question = buildQuestion();

			const viewModel = question.toViewModel(
				buildViewModelOptions(buildAnswers({ examinationWebsite: 'www.example.com/examination' }))
			);

			assert.equal(viewModel.examinationWebsiteLink?.text, 'www.example.com/examination');
			assert.equal(viewModel.examinationWebsiteLink?.href, 'https://www.example.com/examination');
		});

		it('should not link the examination website when it has not been added', () => {
			const question = buildQuestion();

			const viewModel = question.toViewModel(buildViewModelOptions(buildAnswers({ examinationWebsite: '  ' })));

			assert.equal(viewModel.examinationWebsiteLink, undefined);
		});
	});

	describe('template', () => {
		const renderPage = (answers: Record<string, unknown>) => {
			const viewModel = buildQuestion().toViewModel(buildViewModelOptions(answers));
			return configureNunjucks().render('views/layouts/custom-documents-viewer/index.njk', {
				...viewModel,
				layoutTemplate: 'views/layouts/forms-question.njk',
				config: { headerTitle: 'Manage', footerLinks: [] },
				reference: REFERENCE
			});
		};

		const countMatches = (html: string, text: string) => html.split(text).length - 1;

		it('should show the Gateway 3 documents page heading', () => {
			assert.match(renderPage(buildAnswers()), /<h1 class="govuk-heading-l">Gateway 3 documents<\/h1>/);
		});

		const summaryValueFor = (html: string, label: string) =>
			html
				.match(new RegExp(`${label}</span>\\s*</dt>\\s*<dd class="govuk-summary-list__value">([\\s\\S]*?)</dd>`))?.[1]
				.trim();

		it('should link both the filename and View action to each added file', () => {
			const html = renderPage(
				buildAnswers({
					proposedLocalPlan: 'plan.pdf, plan-appendix.pdf',
					optionalData: { environmentalReport: 'environmental-report.pdf' },
					documentFiles: {
						proposedLocalPlan: [
							{ guid: 'plan-guid', fileName: 'plan.pdf' },
							{ guid: 'appendix-guid', fileName: 'plan-appendix.pdf' }
						],
						environmentalReport: [{ guid: 'environmental-guid', fileName: 'environmental-report.pdf' }]
					}
				})
			);

			assert.equal(countMatches(html, 'data-cy="view-document-link"'), 3);
			for (const guid of ['plan-guid', 'appendix-guid', 'environmental-guid']) {
				assert.equal(countMatches(html, `href="${downloadUrl(guid)}"`), 2);
			}
			assert.match(html, /View<span class="govuk-visually-hidden"> plan-appendix\.pdf<\/span>/);
			assert.match(html, /plan\.pdf<\/a><br><a [^>]+>plan-appendix\.pdf<\/a>/);
		});

		it('should not show a View link for documents that have not been added', () => {
			const html = renderPage(buildAnswers({ examinationWebsite: EXAMINATION_WEBSITE }));

			assert.equal(countMatches(html, 'data-cy="view-document-link"'), 0);
			assert.ok(!html.includes('download-case-document'));
			assert.equal(summaryValueFor(html, DOCUMENT_LABELS.mapOfPolicies), NOT_PROVIDED);
			assert.equal(
				summaryValueFor(html, DOCUMENT_LABELS.examinationWebsite),
				`<a href="${EXAMINATION_WEBSITE}" class="govuk-link" rel="noreferrer noopener" target="_blank" data-cy="examination-website-link">${EXAMINATION_WEBSITE}</a>`
			);
		});

		it('should escape file names', () => {
			const html = renderPage(
				buildAnswers({
					proposedLocalPlan: '<b>plan</b>.pdf',
					documentFiles: { proposedLocalPlan: [{ guid: 'plan-guid', fileName: '<b>plan</b>.pdf' }] }
				})
			);

			assert.ok(!html.includes('<b>plan</b>'));
			assert.ok(html.includes('&lt;b&gt;plan&lt;/b&gt;.pdf'));
		});

		it('should keep the row id that missing document errors link to', () => {
			const html = renderPage(
				buildAnswers({
					proposedLocalPlan: 'plan.pdf',
					documentFiles: { proposedLocalPlan: [{ guid: 'plan-guid', fileName: 'plan.pdf' }] }
				})
			);

			assert.ok(html.includes('id="document-proposed-local-plan-intended-for-submission-for-examination"'));
			assert.ok(html.includes('id="document-map-of-proposed-local-plan-policies"'));
		});

		it('should build a download link for each required document file, keyed by label', () => {
			const question = buildQuestion();
			const answers = buildAnswers({
				proposedLocalPlan: 'plan.pdf, plan-appendix.pdf',
				documentFiles: {
					proposedLocalPlan: [
						{ guid: 'plan-guid', fileName: 'plan.pdf' },
						{ guid: 'appendix-guid', fileName: 'plan-appendix.pdf' }
					]
				}
			});

			const viewModel = question.toViewModel(buildViewModelOptions(answers));

			assert.deepEqual(
				Object.keys(viewModel.requiredDocumentFiles),
				requiredDocumentFields.map((field) => DOCUMENT_LABELS[field])
			);
			assert.deepEqual(viewModel.requiredDocumentFiles[DOCUMENT_LABELS.proposedLocalPlan], [
				{ fileName: 'plan.pdf', downloadUrl: downloadUrl('plan-guid') },
				{ fileName: 'plan-appendix.pdf', downloadUrl: downloadUrl('appendix-guid') }
			]);
			assert.deepEqual(viewModel.requiredDocumentFiles[DOCUMENT_LABELS.mapOfPolicies], []);
		});

		it('should build a download link for each optional document file, keyed by label', () => {
			const question = buildQuestion();
			const answers = buildAnswers({
				optionalData: { environmentalReport: 'environmental-report.pdf' },
				documentFiles: { environmentalReport: [{ guid: 'environmental-guid', fileName: 'environmental-report.pdf' }] }
			});

			const viewModel = question.toViewModel(buildViewModelOptions(answers));

			assert.deepEqual(
				Object.keys(viewModel.optionalDocumentFiles),
				optionalDocumentFields.map((field) => DOCUMENT_LABELS[field])
			);
			assert.deepEqual(viewModel.optionalDocumentFiles[DOCUMENT_LABELS.environmentalReport], [
				{ fileName: 'environmental-report.pdf', downloadUrl: downloadUrl('environmental-guid') }
			]);
			assert.deepEqual(viewModel.optionalDocumentFiles[DOCUMENT_LABELS.otherDocuments], []);
		});

		it('should encode the case reference and document guid in download links', () => {
			const question = buildQuestion();
			const answers = buildAnswers({
				documentFiles: { statementOfCompliance: [{ guid: 'guid with/slash', fileName: 'compliance.pdf' }] }
			});
			const options = buildViewModelOptions(answers);
			options.params.reference = 'PLAN 1/2';

			const viewModel = question.toViewModel(options);

			assert.equal(
				viewModel.requiredDocumentFiles[DOCUMENT_LABELS.statementOfCompliance][0].downloadUrl,
				'/case/PLAN%201%2F2/download-case-document/guid%20with%2Fslash'
			);
		});

		it('should give every document an empty file list when no document files have been compiled', () => {
			const question = buildQuestion();

			const viewModel = question.toViewModel(buildViewModelOptions(buildAnswers()));

			assert.ok(Object.values(viewModel.requiredDocumentFiles).every((files: any) => files.length === 0));
			assert.ok(Object.values(viewModel.optionalDocumentFiles).every((files: any) => files.length === 0));
		});
	});

	describe('template', () => {
		const renderPage = (answers: Record<string, unknown>) => {
			const viewModel = buildQuestion().toViewModel(buildViewModelOptions(answers));
			return configureNunjucks().render('views/layouts/custom-documents-viewer/index.njk', {
				...viewModel,
				layoutTemplate: 'views/layouts/forms-question.njk',
				config: { headerTitle: 'Manage', footerLinks: [] },
				reference: REFERENCE
			});
		};

		const countMatches = (html: string, text: string) => html.split(text).length - 1;

		// The trimmed value cell of the summary row with this label
		const summaryValueFor = (html: string, label: string) =>
			html
				.match(new RegExp(`${label}</span>\\s*</dt>\\s*<dd class="govuk-summary-list__value">([\\s\\S]*?)</dd>`))?.[1]
				.trim();

		it('should show a View link to download each added file', () => {
			const html = renderPage(
				buildAnswers({
					proposedLocalPlan: 'plan.pdf, plan-appendix.pdf',
					optionalData: { environmentalReport: 'environmental-report.pdf' },
					documentFiles: {
						proposedLocalPlan: [
							{ guid: 'plan-guid', fileName: 'plan.pdf' },
							{ guid: 'appendix-guid', fileName: 'plan-appendix.pdf' }
						],
						environmentalReport: [{ guid: 'environmental-guid', fileName: 'environmental-report.pdf' }]
					}
				})
			);

			assert.equal(countMatches(html, 'data-cy="view-document-link"'), 3);
			for (const guid of ['plan-guid', 'appendix-guid', 'environmental-guid']) {
				assert.equal(countMatches(html, `href="${downloadUrl(guid)}"`), 2);
			}
			assert.match(html, /View<span class="govuk-visually-hidden"> plan-appendix\.pdf<\/span>/);
			assert.match(html, /plan\.pdf<\/a><br><a [^>]+>plan-appendix\.pdf<\/a>/);
		});

		it('should not show a View link for documents that have not been added', () => {
			const html = renderPage(buildAnswers());

			assert.equal(countMatches(html, 'data-cy="view-document-link"'), 0);
			assert.ok(!html.includes('download-case-document'));
			assert.equal(summaryValueFor(html, DOCUMENT_LABELS.mapOfPolicies), NOT_PROVIDED);
			assert.equal(summaryValueFor(html, DOCUMENT_LABELS.examinationWebsite), NOT_PROVIDED);
			assert.equal(countMatches(html, 'data-cy="examination-website-link"'), 0);
		});

		it('should show the examination website as a link that opens in a new tab', () => {
			const html = renderPage(buildAnswers({ examinationWebsite: 'www.example.com/examination' }));

			assert.equal(
				summaryValueFor(html, DOCUMENT_LABELS.examinationWebsite),
				'<a href="https://www.example.com/examination" class="govuk-link" rel="noreferrer noopener" target="_blank" data-cy="examination-website-link">www.example.com/examination</a>'
			);
		});

		it('should escape the examination website link', () => {
			const html = renderPage(buildAnswers({ examinationWebsite: 'https://example.com/"><b>x</b>' }));

			assert.equal(
				summaryValueFor(html, DOCUMENT_LABELS.examinationWebsite),
				'<a href="https://example.com/&quot;&gt;&lt;b&gt;x&lt;/b&gt;" class="govuk-link" rel="noreferrer noopener" target="_blank" data-cy="examination-website-link">https://example.com/&quot;&gt;&lt;b&gt;x&lt;/b&gt;</a>'
			);
		});

		it('should escape file names', () => {
			const html = renderPage(
				buildAnswers({
					proposedLocalPlan: '<b>plan</b>.pdf',
					documentFiles: { proposedLocalPlan: [{ guid: 'plan-guid', fileName: '<b>plan</b>.pdf' }] }
				})
			);

			assert.ok(!html.includes('<b>plan</b>'));
			assert.ok(html.includes('&lt;b&gt;plan&lt;/b&gt;.pdf'));
		});

		it('should keep the row id that missing document errors link to', () => {
			const html = renderPage(
				buildAnswers({
					proposedLocalPlan: 'plan.pdf',
					documentFiles: { proposedLocalPlan: [{ guid: 'plan-guid', fileName: 'plan.pdf' }] }
				})
			);

			assert.ok(html.includes('id="document-proposed-local-plan-intended-for-submission-for-examination"'));
			assert.ok(html.includes('id="document-map-of-proposed-local-plan-policies"'));
		});

		it('should build a download link for each required document file, keyed by label', () => {
			const question = buildQuestion();
			const answers = buildAnswers({
				proposedLocalPlan: 'plan.pdf, plan-appendix.pdf',
				documentFiles: {
					proposedLocalPlan: [
						{ guid: 'plan-guid', fileName: 'plan.pdf' },
						{ guid: 'appendix-guid', fileName: 'plan-appendix.pdf' }
					]
				}
			});

			const viewModel = question.toViewModel(buildViewModelOptions(answers));

			assert.deepEqual(
				Object.keys(viewModel.requiredDocumentFiles),
				requiredDocumentFields.map((field) => DOCUMENT_LABELS[field])
			);
			assert.deepEqual(viewModel.requiredDocumentFiles[DOCUMENT_LABELS.proposedLocalPlan], [
				{ fileName: 'plan.pdf', downloadUrl: downloadUrl('plan-guid') },
				{ fileName: 'plan-appendix.pdf', downloadUrl: downloadUrl('appendix-guid') }
			]);
			assert.deepEqual(viewModel.requiredDocumentFiles[DOCUMENT_LABELS.mapOfPolicies], []);
		});

		it('should build a download link for each optional document file, keyed by label', () => {
			const question = buildQuestion();
			const answers = buildAnswers({
				optionalData: { environmentalReport: 'environmental-report.pdf' },
				documentFiles: { environmentalReport: [{ guid: 'environmental-guid', fileName: 'environmental-report.pdf' }] }
			});

			const viewModel = question.toViewModel(buildViewModelOptions(answers));

			assert.deepEqual(
				Object.keys(viewModel.optionalDocumentFiles),
				optionalDocumentFields.map((field) => DOCUMENT_LABELS[field])
			);
			assert.deepEqual(viewModel.optionalDocumentFiles[DOCUMENT_LABELS.environmentalReport], [
				{ fileName: 'environmental-report.pdf', downloadUrl: downloadUrl('environmental-guid') }
			]);
			assert.deepEqual(viewModel.optionalDocumentFiles[DOCUMENT_LABELS.otherDocuments], []);
		});

		it('should encode the case reference and document guid in download links', () => {
			const question = buildQuestion();
			const answers = buildAnswers({
				documentFiles: { statementOfCompliance: [{ guid: 'guid with/slash', fileName: 'compliance.pdf' }] }
			});
			const options = buildViewModelOptions(answers);
			options.params.reference = 'PLAN 1/2';

			const viewModel = question.toViewModel(options);

			assert.equal(
				viewModel.requiredDocumentFiles[DOCUMENT_LABELS.statementOfCompliance][0].downloadUrl,
				'/case/PLAN%201%2F2/download-case-document/guid%20with%2Fslash'
			);
		});

		it('should give every document an empty file list when no document files have been compiled', () => {
			const question = buildQuestion();

			const viewModel = question.toViewModel(buildViewModelOptions(buildAnswers()));

			assert.ok(Object.values(viewModel.requiredDocumentFiles).every((files: any) => files.length === 0));
			assert.ok(Object.values(viewModel.optionalDocumentFiles).every((files: any) => files.length === 0));
		});
	});

	describe('template', () => {
		const renderPage = (answers: Record<string, unknown>) => {
			const viewModel = buildQuestion().toViewModel(buildViewModelOptions(answers));
			return configureNunjucks().render('views/layouts/custom-documents-viewer/index.njk', {
				...viewModel,
				layoutTemplate: 'views/layouts/forms-question.njk',
				config: { headerTitle: 'Manage', footerLinks: [] },
				reference: REFERENCE
			});
		};

		const countMatches = (html: string, text: string) => html.split(text).length - 1;

		// The trimmed value cell of the summary row with this label
		const summaryValueFor = (html: string, label: string) =>
			html
				.match(new RegExp(`${label}</span>\\s*</dt>\\s*<dd class="govuk-summary-list__value">([\\s\\S]*?)</dd>`))?.[1]
				.trim();

		it('should show a View link to download each added file', () => {
			const html = renderPage(
				buildAnswers({
					proposedLocalPlan: 'plan.pdf, plan-appendix.pdf',
					optionalData: { environmentalReport: 'environmental-report.pdf' },
					documentFiles: {
						proposedLocalPlan: [
							{ guid: 'plan-guid', fileName: 'plan.pdf' },
							{ guid: 'appendix-guid', fileName: 'plan-appendix.pdf' }
						],
						environmentalReport: [{ guid: 'environmental-guid', fileName: 'environmental-report.pdf' }]
					}
				})
			);

			assert.equal(countMatches(html, 'data-cy="view-document-link"'), 3);
			for (const guid of ['plan-guid', 'appendix-guid', 'environmental-guid']) {
				assert.equal(countMatches(html, `href="${downloadUrl(guid)}"`), 2);
			}
			assert.match(html, /View<span class="govuk-visually-hidden"> plan-appendix\.pdf<\/span>/);
			assert.match(html, /plan\.pdf<\/a><br><a [^>]+>plan-appendix\.pdf<\/a>/);
		});

		it('should not show a View link for documents that have not been added', () => {
			const html = renderPage(buildAnswers({ examinationWebsite: EXAMINATION_WEBSITE }));

			assert.equal(countMatches(html, 'data-cy="view-document-link"'), 0);
			assert.ok(!html.includes('download-case-document'));
			assert.equal(summaryValueFor(html, DOCUMENT_LABELS.mapOfPolicies), NOT_PROVIDED);
			assert.equal(
				summaryValueFor(html, DOCUMENT_LABELS.examinationWebsite),
				`<a href="${EXAMINATION_WEBSITE}" class="govuk-link" rel="noreferrer noopener" target="_blank" data-cy="examination-website-link">${EXAMINATION_WEBSITE}</a>`
			);
		});

		it('should escape file names', () => {
			const html = renderPage(
				buildAnswers({
					proposedLocalPlan: '<b>plan</b>.pdf',
					documentFiles: { proposedLocalPlan: [{ guid: 'plan-guid', fileName: '<b>plan</b>.pdf' }] }
				})
			);

			assert.ok(!html.includes('<b>plan</b>'));
			assert.ok(html.includes('&lt;b&gt;plan&lt;/b&gt;.pdf'));
		});

		it('should keep the row id that missing document errors link to', () => {
			const html = renderPage(
				buildAnswers({
					proposedLocalPlan: 'plan.pdf',
					documentFiles: { proposedLocalPlan: [{ guid: 'plan-guid', fileName: 'plan.pdf' }] }
				})
			);

			assert.ok(html.includes('id="document-proposed-local-plan-intended-for-submission-for-examination"'));
			assert.ok(html.includes('id="document-map-of-proposed-local-plan-policies"'));
		});

		it('should build a download link for each required document file, keyed by label', () => {
			const question = buildQuestion();
			const answers = buildAnswers({
				proposedLocalPlan: 'plan.pdf, plan-appendix.pdf',
				documentFiles: {
					proposedLocalPlan: [
						{ guid: 'plan-guid', fileName: 'plan.pdf' },
						{ guid: 'appendix-guid', fileName: 'plan-appendix.pdf' }
					]
				}
			});

			const viewModel = question.toViewModel(buildViewModelOptions(answers));

			assert.deepEqual(
				Object.keys(viewModel.requiredDocumentFiles),
				requiredDocumentFields.map((field) => DOCUMENT_LABELS[field])
			);
			assert.deepEqual(viewModel.requiredDocumentFiles[DOCUMENT_LABELS.proposedLocalPlan], [
				{ fileName: 'plan.pdf', downloadUrl: downloadUrl('plan-guid') },
				{ fileName: 'plan-appendix.pdf', downloadUrl: downloadUrl('appendix-guid') }
			]);
			assert.deepEqual(viewModel.requiredDocumentFiles[DOCUMENT_LABELS.mapOfPolicies], []);
		});

		it('should build a download link for each optional document file, keyed by label', () => {
			const question = buildQuestion();
			const answers = buildAnswers({
				optionalData: { environmentalReport: 'environmental-report.pdf' },
				documentFiles: { environmentalReport: [{ guid: 'environmental-guid', fileName: 'environmental-report.pdf' }] }
			});

			const viewModel = question.toViewModel(buildViewModelOptions(answers));

			assert.deepEqual(
				Object.keys(viewModel.optionalDocumentFiles),
				optionalDocumentFields.map((field) => DOCUMENT_LABELS[field])
			);
			assert.deepEqual(viewModel.optionalDocumentFiles[DOCUMENT_LABELS.environmentalReport], [
				{ fileName: 'environmental-report.pdf', downloadUrl: downloadUrl('environmental-guid') }
			]);
			assert.deepEqual(viewModel.optionalDocumentFiles[DOCUMENT_LABELS.otherDocuments], []);
		});

		it('should encode the case reference and document guid in download links', () => {
			const question = buildQuestion();
			const answers = buildAnswers({
				documentFiles: { statementOfCompliance: [{ guid: 'guid with/slash', fileName: 'compliance.pdf' }] }
			});
			const options = buildViewModelOptions(answers);
			options.params.reference = 'PLAN 1/2';

			const viewModel = question.toViewModel(options);

			assert.equal(
				viewModel.requiredDocumentFiles[DOCUMENT_LABELS.statementOfCompliance][0].downloadUrl,
				'/case/PLAN%201%2F2/download-case-document/guid%20with%2Fslash'
			);
		});

		it('should give every document an empty file list when no document files have been compiled', () => {
			const question = buildQuestion();

			const viewModel = question.toViewModel(buildViewModelOptions(buildAnswers()));

			assert.ok(Object.values(viewModel.requiredDocumentFiles).every((files: any) => files.length === 0));
			assert.ok(Object.values(viewModel.optionalDocumentFiles).every((files: any) => files.length === 0));
		});
	});

	describe('template', () => {
		const renderPage = (answers: Record<string, unknown>) => {
			const viewModel = buildQuestion().toViewModel(buildViewModelOptions(answers));
			return configureNunjucks().render('views/layouts/custom-documents-viewer/index.njk', {
				...viewModel,
				layoutTemplate: 'views/layouts/forms-question.njk',
				config: { headerTitle: 'Manage', footerLinks: [] },
				reference: REFERENCE
			});
		};

		const countMatches = (html: string, text: string) => html.split(text).length - 1;

		// The trimmed value cell of the summary row with this label
		const summaryValueFor = (html: string, label: string) =>
			html
				.match(new RegExp(`${label}</span>\\s*</dt>\\s*<dd class="govuk-summary-list__value">([\\s\\S]*?)</dd>`))?.[1]
				.trim();

		it('should show a View link to download each added file', () => {
			const html = renderPage(
				buildAnswers({
					proposedLocalPlan: 'plan.pdf, plan-appendix.pdf',
					optionalData: { environmentalReport: 'environmental-report.pdf' },
					documentFiles: {
						proposedLocalPlan: [
							{ guid: 'plan-guid', fileName: 'plan.pdf' },
							{ guid: 'appendix-guid', fileName: 'plan-appendix.pdf' }
						],
						environmentalReport: [{ guid: 'environmental-guid', fileName: 'environmental-report.pdf' }]
					}
				})
			);

			assert.equal(countMatches(html, 'data-cy="view-document-link"'), 3);
			for (const guid of ['plan-guid', 'appendix-guid', 'environmental-guid']) {
				assert.equal(countMatches(html, `href="${downloadUrl(guid)}"`), 2);
			}
			assert.match(html, /View<span class="govuk-visually-hidden"> plan-appendix\.pdf<\/span>/);
			assert.match(html, /plan\.pdf<\/a><br><a [^>]+>plan-appendix\.pdf<\/a>/);
		});

		it('should not show a View link for documents that have not been added', () => {
			const html = renderPage(buildAnswers({ examinationWebsite: EXAMINATION_WEBSITE }));

			assert.equal(countMatches(html, 'data-cy="view-document-link"'), 0);
			assert.ok(!html.includes('download-case-document'));
			assert.equal(summaryValueFor(html, DOCUMENT_LABELS.mapOfPolicies), NOT_PROVIDED);
			assert.equal(
				summaryValueFor(html, DOCUMENT_LABELS.examinationWebsite),
				`<a href="${EXAMINATION_WEBSITE}" class="govuk-link" rel="noreferrer noopener" target="_blank" data-cy="examination-website-link">${EXAMINATION_WEBSITE}</a>`
			);
		});

		it('should escape file names', () => {
			const html = renderPage(
				buildAnswers({
					proposedLocalPlan: '<b>plan</b>.pdf',
					documentFiles: { proposedLocalPlan: [{ guid: 'plan-guid', fileName: '<b>plan</b>.pdf' }] }
				})
			);

			assert.ok(!html.includes('<b>plan</b>'));
			assert.ok(html.includes('&lt;b&gt;plan&lt;/b&gt;.pdf'));
		});

		it('should keep the row id that missing document errors link to', () => {
			const html = renderPage(
				buildAnswers({
					proposedLocalPlan: 'plan.pdf',
					documentFiles: { proposedLocalPlan: [{ guid: 'plan-guid', fileName: 'plan.pdf' }] }
				})
			);

			assert.ok(html.includes('id="document-proposed-local-plan-intended-for-submission-for-examination"'));
			assert.ok(html.includes('id="document-map-of-proposed-local-plan-policies"'));
		});
	});
});
