import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { configureNunjucks } from '../../../nunjucks.ts';
import { examinationSubmissionRoutes } from './index.ts';
import { REQUIRED_EXAMINATION_ITEM_TITLES } from './questions.ts';

const itemTitles = [
	'Examination website',
	'Local plan submission for examination',
	'Map of proposed local plan policies',
	'Gateway 3 completion statement',
	'Summary of consultation and engagement activities in preparing the proposed local plan',
	'Summary of consultation on proposed local plan',
	'Representations on conformity with an operative spatial development strategy',
	'Statement of compliance',
	'Statement of soundness',
	'Environmental report',
	'Statement demonstrating that the proposed local plan is unlikely to have significant environmental effects',
	'Additional evidence documents',
	'Statement explaining changes made since Gateway 3 assessment and details of any additional consultations',
	'Representations required in the Gateway 3 report'
];

function renderPage(statusTag?: { label: string; class: string }, error?: string) {
	const nunjucks = configureNunjucks();
	return nunjucks.render('views/manage-local-plans/examination-submission/check-your-answers.njk', {
		pageTitle: 'Examination',
		pageHeading: 'Examination',
		pageCaption: 'Test local plan',
		targetDate: '1 September 2026',
		backLinkUrl: '/manage-local-plans/PLAN-61797',
		saveAndComeBackUrl: '/manage-local-plans/PLAN-61797',
		statusTag,
		requiredItemTitles: REQUIRED_EXAMINATION_ITEM_TITLES,
		errors: error ? { submit: { text: error } } : undefined,
		summaryListData: {
			sections: [
				{
					heading: 'Examination details',
					list: {
						rows: itemTitles.map((title) => ({
							key: { text: title },
							value: title === 'Examination website' ? { text: 'https://example.com' } : { text: 'Not added' },
							actions: {
								items: [{ href: '#', text: title === 'Examination website' ? 'Change' : 'Add' }]
							}
						}))
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
}

describe('examinationSubmissionRoutes', () => {
	it('returns an Express router', () => {
		const router = examinationSubmissionRoutes({ createFileStorage: () => ({}) } as never);
		assert.equal(typeof router.get, 'function');
		assert.equal(typeof router.post, 'function');
	});

	it('redirects a valid submission to the declaration page', () => {
		const router = examinationSubmissionRoutes({ createFileStorage: () => ({}) } as never);
		const submitRoute = (router as any).stack.find(
			(layer: any) => layer.route?.path === '/:planReference/examination' && layer.route.methods.post === true
		);
		const submitHandler = submitRoute.route.stack.at(-1).handle;
		const redirectCalls: string[] = [];

		submitHandler(
			{ params: { planReference: 'PLAN 61797/1' } },
			{ redirect: (url: string) => redirectCalls.push(url) }
		);

		assert.deepEqual(redirectCalls, ['/manage-local-plans/PLAN%2061797%2F1/examination/declaration']);
	});
});

describe('examination submission page', () => {
	it('renders the examination heading, status, guidance and expected submission date', () => {
		const html = renderPage({ label: 'Ready to start', class: 'govuk-tag govuk-tag--green' });
		const normalizedHtml = html.replace(/\s+/g, ' ');

		assert.match(
			normalizedHtml,
			/<h1 class="govuk-heading-xl govuk-!-margin-bottom-2"> <span class="govuk-caption-xl">Test local plan<\/span> Examination <\/h1>/
		);
		assert.ok(html.includes('govuk-tag govuk-tag--green'));
		assert.ok(html.includes('Ready to start'));
		assert.ok(html.includes('data-cy="back-link"'));
		assert.ok(
			html.includes(
				'This examination is the final step to get approval to adopt your local plan. Most of these documents are required, but some are only needed in certain circumstances. For more information on the examination documents,'
			)
		);
		assert.match(html, /<a href="\/guidance" class="govuk-link">check the guidance<\/a>/);
		assert.ok(
			html.includes(
				"You've provided the expected submission date of 1 September 2026. The examination can take up to 6 months. The process can also be paused for up to 6 months if required."
			)
		);
		assert.ok(html.indexOf('check the guidance') < html.indexOf('Save and come back later'));
	});

	it('renders every item, status, action and exactly eight Required hints', () => {
		const html = renderPage();
		for (const title of itemTitles) {
			assert.ok(html.includes(title), `expected row for ${title}`);
		}
		assert.equal((html.match(/>Required<\/div>/g) ?? []).length, 8);
		assert.match(
			html,
			/<td class="govuk-table__cell" style="overflow-wrap: break-word; word-break: break-word">\s*https:\/\/example\.com\s*<\/td>/
		);
		assert.ok(html.includes('Change'));
		assert.ok(html.includes('Not added'));
		assert.ok(html.includes('Add'));
		assert.ok(html.includes('data-cy="add-examination-website"'));
		assert.ok(!html.includes('data-cy="change-examination-website"'));
	});

	it('renders the examination status when provided', () => {
		const html = renderPage({ label: 'In progress', class: 'govuk-tag govuk-tag--blue' });
		assert.ok(html.includes('In progress'));
		assert.ok(html.includes('govuk-tag--blue'));
	});

	it('renders the ready-to-submit content and required-document error', () => {
		const html = renderPage(undefined, 'Add all required documents before you submit');
		assert.ok(html.includes('Ready to submit for examination'));
		assert.ok(html.includes('Once submitted, examination will be locked and you cannot make further changes.'));
		assert.ok(html.includes('data-cy="submit-examination"'));
		assert.ok(html.includes('Add all required documents before you submit'));
	});
});

describe('examination declaration page', () => {
	function renderDeclaration() {
		const nunjucks = configureNunjucks();
		return nunjucks.render('views/manage-local-plans/examination-submission/declaration/declaration.njk', {
			pageTitle: "Are you sure you're ready to submit?",
			pageHeading: "Are you sure you're ready to submit?",
			backLinkUrl: '/manage-local-plans/PLAN-61797/examination',
			goBackUrl: '/manage-local-plans/PLAN-61797/examination',
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			}
		});
	}

	it('renders the declaration heading, warning and confirmation controls', () => {
		const html = renderDeclaration();

		assert.ok(html.includes('Are you sure you&#39;re ready to submit?'));
		assert.ok(html.includes("This can't be undone."));
		assert.ok(html.includes('Yes, confirm submission'));
		assert.ok(html.includes('data-cy="confirm-submission"'));
		assert.ok(html.includes('No, go back'));
		assert.match(html, /href="\/manage-local-plans\/PLAN-61797\/examination" class="govuk-link" data-cy="no-go-back"/);
	});

	it('renders the Back link to the examination submission page', () => {
		const html = renderDeclaration();
		assert.ok(html.includes('data-cy="back-link"'));
		assert.match(html, /href="\/manage-local-plans\/PLAN-61797\/examination"/);
	});
});

describe('examination submission complete page', () => {
	function renderSubmissionComplete() {
		const nunjucks = configureNunjucks();
		return nunjucks.render('views/manage-local-plans/examination-submission/declaration/submission-complete.njk', {
			pageTitle: 'Submission complete',
			pageHeading: 'Submission complete',
			planOverviewUrl: '/manage-local-plans/PLAN-61797',
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			}
		});
	}

	it('renders the successful submission panel and confirmation copy', () => {
		const html = renderSubmissionComplete();
		assert.ok(html.includes('Submission complete'));
		assert.ok(html.includes('We have sent you a confirmation email.'));
	});

	it('renders the examination next steps', () => {
		const html = renderSubmissionComplete();
		assert.ok(html.includes('What happens next'));
		assert.ok(html.includes('appoint one or more inspectors to your case'));
		assert.ok(html.includes('review your submission documents'));
		assert.ok(html.includes('let you know if they need any additional information'));
	});

	it('links check your submission status to plan details', () => {
		const html = renderSubmissionComplete();
		assert.ok(html.includes('check your submission status'));
		assert.match(html, /href="\/manage-local-plans\/PLAN-61797" class="govuk-link" data-cy="check-submission-status"/);
	});
});

describe('submitted examination page', () => {
	it('renders submitted documents without edit or submit actions', () => {
		const nunjucks = configureNunjucks();
		const html = nunjucks.render('views/manage-local-plans/examination-submission/check-your-answers-submitted.njk', {
			pageTitle: 'Examination submission',
			pageHeading: 'Examination submission',
			pageCaption: 'Test local plan',
			submissionDate: '21 October 2026',
			submissionTime: '11:30',
			submitter: 'planner@example.com',
			statusTag: { label: 'Submitted', class: 'govuk-tag govuk-tag--yellow' },
			summaryListData: {
				sections: [
					{
						list: {
							rows: [
								{
									key: { text: 'Local plan submission for examination' },
									value: {
										html: '<ul class="govuk-list govuk-list--bullet"><li><a href="/documents/local-plan">local-plan.pdf</a></li><li><a href="/documents/appendix">appendix.pdf</a></li></ul>'
									},
									actions: { items: [{ text: 'Change', href: '#' }] }
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

		assert.match(
			html.replace(/\s+/g, ' '),
			/<h1 class="govuk-heading-xl govuk-!-margin-bottom-2"> <span class="govuk-caption-xl">Test local plan<\/span> Examination submission <\/h1>/
		);
		assert.ok(html.includes('govuk-tag govuk-tag--yellow'));
		assert.ok(html.includes('Submitted'));
		assert.ok(html.includes('Your submission was sent on 21 October 2026 at 11:30 by planner@example.com'));
		assert.match(html, /<h2 class="govuk-heading-m">Documents<\/h2>/);
		assert.ok(html.includes('Local plan submission for examination'));
		assert.ok(html.includes('govuk-list govuk-list--bullet'));
		assert.ok(html.includes('local-plan.pdf'));
		assert.ok(html.includes('appendix.pdf'));
		assert.doesNotMatch(html, />\s*(Add|Change|Submit)\s*</);
	});
});
