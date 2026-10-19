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
		pageTitle: 'Examination submission',
		pageHeading: 'Examination submission',
		pageCaption: 'Test local plan',
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
});

describe('examination submission page', () => {
	it('renders every item, status, action and exactly eight Required hints', () => {
		const html = renderPage();
		for (const title of itemTitles) {
			assert.ok(html.includes(title), `expected row for ${title}`);
		}
		assert.equal((html.match(/>Required<\/div>/g) ?? []).length, 8);
		assert.ok(html.includes('https://example.com'));
		assert.ok(html.includes('Change'));
		assert.ok(html.includes('Not added'));
		assert.ok(html.includes('Add'));
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
