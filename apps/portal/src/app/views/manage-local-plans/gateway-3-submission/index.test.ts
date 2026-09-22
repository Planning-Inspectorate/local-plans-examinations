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
