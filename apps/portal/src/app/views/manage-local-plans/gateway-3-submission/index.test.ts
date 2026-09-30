import assert from 'node:assert';
import { describe, it } from 'node:test';
import { gateway3SubmissionRoutes } from './index.ts';
import { configureNunjucks } from '../../../nunjucks.ts';

describe('gateway3SubmissionRoutes', () => {
	it('returns an express router with get, post and use methods', () => {
		const mockService = {
			createFileStorage: () => ({})
		} as any;
		const router = gateway3SubmissionRoutes(mockService);
		assert.strictEqual(typeof router.get, 'function');
		assert.strictEqual(typeof router.post, 'function');
		assert.strictEqual(typeof router.use, 'function');
	});
});

describe('Gateway 3 check answers page', () => {
	function renderCheckAnswers(sections: unknown[]) {
		const nunjucks = configureNunjucks();
		return nunjucks.render('views/manage-local-plans/gateway-3-submission/check-your-answers.njk', {
			targetDate: '1 August 2026',
			saveAndComeBackUrl: '/manage-local-plans/PLAN-001',
			summaryListData: { sections },
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			}
		});
	}

	function buildSection(heading: string) {
		return {
			heading,
			list: {
				rows: [
					{
						key: { text: 'Other documents' },
						value: { text: 'Not added' },
						actions: {
							items: [{ href: '#', text: 'Add' }]
						}
					}
				]
			}
		};
	}

	it('renders the submit section with heading, copy and a submit button', () => {
		const html = renderCheckAnswers([]);

		assert.ok(html.includes('Ready to submit for Gateway 3'), 'expected submit heading');
		assert.ok(
			html.includes('Once submitted, Gateway 3 will be locked and you cannot make further changes.'),
			'expected submit copy'
		);
		assert.ok(html.includes('data-cy="submit-gateway-3"'), 'expected submit button data-cy');
	});

	it('renders the Optional Documents section with copy and an Add action', () => {
		const html = renderCheckAnswers([buildSection('Optional Documents')]);

		assert.ok(html.includes('Optional Documents'), 'expected Optional Documents heading');
		assert.ok(
			html.includes('Add the documents that are relevant to your plan.'),
			'expected optional documents guidance copy'
		);
		assert.ok(html.includes('data-cy="optional-documents-section"'), 'expected section data-cy attribute');
		assert.ok(html.includes('Not added'), 'expected Not added status');
		assert.ok(html.includes('Add'), 'expected Add action link');
	});

	it('does not render the optional documents copy for other sections', () => {
		const html = renderCheckAnswers([buildSection('Required Information')]);

		assert.ok(
			!html.includes('Add the documents that are relevant to your plan.'),
			'expected no optional documents guidance copy'
		);
	});
});

describe('Gateway 3 declaration page', () => {
	function renderDeclaration(data: Record<string, unknown> = {}) {
		const nunjucks = configureNunjucks();
		return nunjucks.render('views/manage-local-plans/gateway-3-submission/declaration/declaration.njk', {
			pageTitle: "Are you sure you're ready to submit?",
			pageHeading: "Are you sure you're ready to submit?",
			backLinkUrl: '/manage-local-plans/PLAN-001/gateway-3-submission',
			goBackUrl: '/manage-local-plans/PLAN-001/gateway-3-submission',
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			},
			...data
		});
	}

	it('renders the heading with govuk-heading-l size', () => {
		const html = renderDeclaration();
		assert.ok(html.includes('Are you sure you&#39;re ready to submit?'), 'expected declaration heading');
		assert.ok(html.includes('govuk-heading-l'), 'expected govuk-heading-l class');
	});

	it('renders the warning copy', () => {
		const html = renderDeclaration();
		assert.ok(html.includes("This can't be undone."), 'expected warning copy');
	});

	it('renders the confirm submission button and no-go-back link in a button group', () => {
		const html = renderDeclaration();
		assert.ok(html.includes('Yes, confirm submission'), 'expected confirm submission button text');
		assert.ok(html.includes('data-cy="confirm-submission"'), 'expected confirm-submission data-cy');
		assert.ok(html.includes('govuk-button-group'), 'expected govuk-button-group for inline layout');
	});

	it('renders the no go back link', () => {
		const html = renderDeclaration();
		assert.ok(html.includes('No, go back'), 'expected no go back link text');
		assert.ok(html.includes('data-cy="no-go-back"'), 'expected no-go-back data-cy');
		assert.ok(
			html.includes('/manage-local-plans/PLAN-001/gateway-3-submission'),
			'expected go back link to gateway 3 submission page'
		);
	});

	it('renders the back link to gateway 3 submission page', () => {
		const html = renderDeclaration();
		assert.ok(html.includes('data-cy="back-link"'), 'expected back link data-cy');
	});
});

describe('Gateway 3 submission complete page', () => {
	function renderSubmissionComplete(data: Record<string, unknown> = {}) {
		const nunjucks = configureNunjucks();
		return nunjucks.render('views/manage-local-plans/gateway-3-submission/declaration/submission-complete.njk', {
			pageTitle: 'Gateway 3 submission complete',
			pageHeading: 'Gateway 3 submission complete',
			planOverviewUrl: '/manage-local-plans/PLAN-001',
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			},
			...data
		});
	}

	it('renders the submission complete panel with correct title', () => {
		const html = renderSubmissionComplete();
		assert.ok(html.includes('Gateway 3 submission complete'), 'expected Gateway 3 submission complete panel');
	});

	it('renders the confirmation email copy', () => {
		const html = renderSubmissionComplete();
		assert.ok(html.includes('data-cy="confirmation-email-copy"'), 'expected confirmation email copy data-cy');
		assert.ok(
			html.includes('We&#39;ve sent you a confirmation email.') ||
				html.includes("We've sent you a confirmation email."),
			'expected confirmation email text'
		);
	});

	it('renders the what happens next heading and list', () => {
		const html = renderSubmissionComplete();
		assert.ok(html.includes('What happens next'), 'expected What happens next heading');
		assert.ok(html.includes('data-cy="what-happens-next-heading"'), 'expected what-happens-next-heading data-cy');
		assert.ok(html.includes('data-cy="what-happens-next-list"'), 'expected what-happens-next-list data-cy');
		assert.ok(
			html.includes('The Planning Inspectorate will check that your submission is complete'),
			'expected first bullet point'
		);
		assert.ok(
			html.includes('They will contact you if any further information is required'),
			'expected second bullet point'
		);
		assert.ok(
			html.includes('check your submission status'),
			'expected third bullet point with check submission status link'
		);
	});

	it('renders the check your submission status link pointing to plan overview', () => {
		const html = renderSubmissionComplete();
		assert.ok(html.includes('data-cy="check-submission-status"'), 'expected check-submission-status data-cy');
		assert.ok(html.includes('/manage-local-plans/PLAN-001'), 'expected plan overview URL');
	});

	it('renders the get in touch link', () => {
		const html = renderSubmissionComplete();
		assert.ok(html.includes('data-cy="get-in-touch"'), 'expected get-in-touch data-cy');
		assert.ok(html.includes('If you need to adjust your submission,'), 'expected get in touch copy');
		assert.ok(html.includes('contact-us.planninginspectorate.gov.uk'), 'expected contact URL');
	});
});
