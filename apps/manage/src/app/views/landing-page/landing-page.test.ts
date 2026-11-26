import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { configureNunjucks } from '../../nunjucks.ts';

const config = {
	styleFile: 'style.css',
	headerTitle: 'Manage local plans',
	footerLinks: []
};

const cases = [
	{
		reference: 'PLAN-001',
		planTitle: 'First local plan',
		planType: 'local-plan',
		caseOfficerName: 'Case Officer',
		headerStatusText: 'Awaiting SLA',
		headerStatusClasses: 'govuk-tag--yellow'
	}
];

describe('landing-page.njk', () => {
	it('shows the total case count and pagination links', () => {
		const html = configureNunjucks().render('views/landing-page/landing-page.njk', {
			config,
			cases,
			totalCases: 4,
			pagination: {
				previous: null,
				next: { href: '?page=2' },
				items: [
					{ number: 1, href: '?page=1', current: true },
					{ number: 2, href: '?page=2', current: false }
				]
			}
		});

		assert.match(html, /All cases \(4\)/);
		assert.match(html, /class="govuk-pagination/);
		assert.match(html, /href="\?page=2"/);
		assert.match(html, /aria-current="page"/);
	});

	it('does not show pagination for a single page of cases', () => {
		const html = configureNunjucks().render('views/landing-page/landing-page.njk', {
			config,
			cases,
			totalCases: 1,
			pagination: { previous: null, next: null, items: [] }
		});

		assert.doesNotMatch(html, /class="govuk-pagination/);
	});
});
