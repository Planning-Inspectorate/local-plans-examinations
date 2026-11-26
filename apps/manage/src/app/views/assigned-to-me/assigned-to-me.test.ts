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

describe('assigned-to-me.njk', () => {
	it('shows the total assigned case count and pagination links', () => {
		const html = configureNunjucks().render('views/assigned-to-me/assigned-to-me.njk', {
			config,
			cases,
			caseOfficerText: 'Officer One',
			totalCases: 31,
			pagination: {
				previous: null,
				next: { href: '/assigned-to-me?page=2' },
				items: [
					{ number: 1, href: '/assigned-to-me?page=1', current: true },
					{ number: 2, href: '/assigned-to-me?page=2', current: false }
				]
			}
		});

		assert.match(html, /Assigned to Officer One \(31\)/);
		assert.match(html, /class="govuk-pagination/);
		assert.match(html, /href="\/assigned-to-me\?page=2"/);
		assert.match(html, /aria-current="page"/);
	});

	it('does not show pagination for a single page of assigned cases', () => {
		const html = configureNunjucks().render('views/assigned-to-me/assigned-to-me.njk', {
			config,
			cases,
			caseOfficerText: 'Officer One',
			totalCases: 1,
			pagination: { previous: null, next: null, items: [] }
		});

		assert.doesNotMatch(html, /class="govuk-pagination/);
	});
});
