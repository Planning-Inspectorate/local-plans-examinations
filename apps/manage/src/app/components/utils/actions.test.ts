import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { configureNunjucks } from '../../nunjucks.ts';

function renderQuestion(data: Record<string, unknown> = {}) {
	return configureNunjucks().render('components/single-line-input/index.njk', {
		layoutTemplate: 'views/layouts/forms-question.njk',
		config: { headerTitle: 'Manage', footerLinks: [] },
		question: { fieldName: 'planTitle', question: 'Plan title' },
		continueButtonText: 'Save and continue',
		...data
	});
}

describe('Manage form actions', () => {
	for (const [description, data, destination] of [
		[
			'uses the explicit Cancel destination',
			{ cancelLink: '/case/PLAN-001/overview', backLink: '/previous' },
			'/case/PLAN-001/overview'
		],
		['falls back to the Back destination', { backLink: '/previous' }, '/previous']
	] as const) {
		it(`renders one plain Cancel link and retains the submit button when it ${description}`, () => {
			const html = renderQuestion(data);
			const cancelLinks = html.match(/<a\b[^>]*data-cy="button-cancel"[^>]*>Cancel<\/a>/g) ?? [];
			assert.equal(cancelLinks.length, 1);
			assert.ok(cancelLinks[0].includes(`href="${destination}"`));
			assert.match(cancelLinks[0], /class="govuk-link"/);
			assert.ok(!cancelLinks[0].includes('govuk-button'));
			const submit = html.match(/<button\b[^>]*data-cy="button-save-and-continue"[^>]*>[\s\S]*?<\/button>/)?.[0];
			assert.ok(submit);
			assert.match(submit, /type="submit"/);
			assert.ok(submit.includes('Save and continue'));
		});
	}

	it('does not add a Cancel link without a destination', () => {
		const html = renderQuestion();
		assert.ok(!html.includes('data-cy="button-cancel"'));
		assert.ok(html.includes('data-cy="button-save-and-continue"'));
	});

	it('keeps other secondary submit and link actions alongside Cancel', () => {
		const html = renderQuestion({
			cancelLink: '/cancel',
			secondaryActions: [
				{ text: 'Save draft', formaction: '/save-draft' },
				{ text: 'Help', href: '/help' }
			]
		});
		const draft = html.match(/<button\b[^>]*data-cy="button-save-draft"[^>]*>[\s\S]*?<\/button>/)?.[0];
		assert.ok(draft);
		assert.match(draft, /formaction="\/save-draft"/);
		assert.match(draft, /name="save-draft"/);
		assert.ok(draft.includes('govuk-button--secondary'));
		const help = html.match(/<a\b[^>]*data-cy="button-help"[^>]*>[\s\S]*?<\/a>/)?.[0];
		assert.ok(help);
		assert.match(help, /href="\/help"/);
		assert.ok(help.includes('govuk-button--secondary'));
		assert.ok(html.includes('data-cy="button-cancel"'));
	});

	it('retains the legacy extraActionButtons fallback in the shared actions component', () => {
		const html = configureNunjucks().render('components/utils/actions.njk', {
			continueButtonText: 'Continue',
			extraActionButtons: [{ text: 'Save draft', type: 'submit', formaction: '/save-draft' }]
		});
		assert.ok(html.includes('data-cy="button-save-and-continue"'));
		assert.ok(html.includes('data-cy="button-save-draft"'));
		assert.ok(html.includes('formaction="/save-draft"'));
	});
});
