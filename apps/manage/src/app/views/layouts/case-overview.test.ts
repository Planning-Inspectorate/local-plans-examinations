import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { configureNunjucks } from '../../nunjucks.ts';

function assertStringOccursInHtmlExactlyOnce(html: string, substring: string) {
	const firstOccurrence = html.indexOf(substring);
	const lastOccurrence = html.lastIndexOf(substring);
	assert.notEqual(firstOccurrence, -1, `Could not find the substring '${substring}' in the html`);
	assert.equal(
		firstOccurrence,
		lastOccurrence,
		`Found more than one occurrence of the substring '${substring}' in the html`
	);
}

describe('test case-overview.njk', () => {
	it('does not duplicate questions', () => {
		const html = configureNunjucks().render('views/layouts/case-overview.njk', {
			planTitle: 'somePlan',
			reference: 'someCaseReference',
			journeyResponse: {
				answers: {
					workshops: [],
					hearings: []
				}
			},
			summaryListData: {
				sections: [
					{
						heading: 'first Heading',
						list: {
							rows: [
								{
									key: {
										text: 'Case notes'
									},
									value: 'case note value',
									actions: {
										items: [
											{
												href: 'case note href'
											}
										]
									}
								},
								{
									key: {
										text: 'Attribute A title'
									},
									value: 'attribute A value',
									actions: {
										items: [
											{
												href: 'attribute A href'
											}
										]
									}
								},
								{
									key: {
										text: 'Attribute B title'
									},
									value: 'attribute B value',
									actions: {
										items: [
											{
												text: 'Answer',
												href: 'attribute B href'
											}
										]
									}
								}
							]
						}
					},
					{
						heading: 'Hearings',
						list: {
							rows: [
								{
									key: {
										text: 'MIQs'
									},
									value: 'MIQ value',
									actions: {
										items: [
											{
												href: 'MIQ href'
											}
										]
									}
								}
							]
						}
					}
				]
			}
		});
		const expectedElements = [
			'first Heading',
			'Attribute A title',
			'<a class="govuk-link" href="attribute A href"></a>',
			'Attribute B title',
			'<a class="govuk-link" href="attribute B href">Add</a>',
			'<h2 class="govuk-heading-l">Hearings</h2>',
			'MIQs',
			'<a class="govuk-link" href="MIQ href"></a>'
		];
		for (const substring of expectedElements) {
			assertStringOccursInHtmlExactlyOnce(html, substring);
		}
	});
});

describe('case-overview.njk assessors block', () => {
	const assessorLink = '/case/someCaseReference/gateway-2/assessor/assessors/assessor-gateway-2';
	const removeLink = '/case/someCaseReference/gateway-2/assessor/remove/first';
	const secondRemoveLink = '/case/someCaseReference/gateway-2/assessor/remove/second-assessor-id';

	function renderOverview(context: Record<string, unknown>, headings = ['Gateway 2', 'Workshop', 'Report']) {
		return configureNunjucks().render('views/layouts/case-overview.njk', {
			planTitle: 'somePlan',
			reference: 'someCaseReference',
			journeyResponse: { answers: { workshops: [], hearings: [] } },
			summaryListData: {
				sections: headings.map((heading) => ({ heading, list: { rows: [] } }))
			},
			...context
		});
	}

	it('shows the Assessors sub-heading and Add assessor link once, after the gateway section', () => {
		const html = renderOverview({ assessorLink, assessors: [] });

		assertStringOccursInHtmlExactlyOnce(html, '>Assessors</h2>');
		assertStringOccursInHtmlExactlyOnce(html, `<a href="${assessorLink}" class="govuk-link" data-cy="add-assessor">`);
		assert.ok(html.indexOf('>Gateway 2</h2>') < html.indexOf('>Assessors</h2>'));
		assert.ok(html.indexOf('>Assessors</h2>') < html.indexOf('>Workshop</h2>'));
	});

	it('shows the assessor and appointed rows with a Remove link once an assessor has been added', () => {
		const html = renderOverview({
			assessorLink,
			assessors: [{ number: 1, name: 'John Doe', appointedDate: '21 October 2026', removeLink }]
		});

		assertStringOccursInHtmlExactlyOnce(html, '>Assessors</h2>');
		assert.match(html, /Assessor 1\s*<\/dt>/);
		assert.match(html, /Assessor 1 appointed\s*<\/dt>/);
		assert.ok(html.includes('John Doe'));
		assert.ok(html.includes('21 October 2026'));
		assert.ok(html.includes(`href="${removeLink}"`));
		assert.ok(html.includes('data-cy="remove-assessor-1"'));
	});

	it('keeps the Add assessor link after the assessor rows so another assessor can be added', () => {
		const html = renderOverview({
			assessorLink,
			assessors: [{ number: 1, name: 'John Doe', appointedDate: '21 October 2026', removeLink }]
		});

		assertStringOccursInHtmlExactlyOnce(html, `<a href="${assessorLink}" class="govuk-link" data-cy="add-assessor">`);
		assert.ok(html.indexOf('data-cy="assessors-list"') < html.indexOf('data-cy="add-assessor"'));
		assert.ok(html.indexOf('data-cy="add-assessor"') < html.indexOf('>Workshop</h2>'));
	});

	it('shows each assessor in their own numbered rows with their own Remove link', () => {
		const html = renderOverview({
			assessorLink,
			assessors: [
				{ number: 1, name: 'John Doe', appointedDate: '21 October 2026', removeLink },
				{ number: 2, name: 'Jane Roe', appointedDate: '5 November 2026', removeLink: secondRemoveLink }
			]
		});

		assertStringOccursInHtmlExactlyOnce(html, '>Assessors</h2>');
		assertStringOccursInHtmlExactlyOnce(html, 'data-cy="assessors-list"');
		assert.match(html, /Assessor 1\s*<\/dt>/);
		assert.match(html, /Assessor 1 appointed\s*<\/dt>/);
		assert.match(html, /Assessor 2\s*<\/dt>/);
		assert.match(html, /Assessor 2 appointed\s*<\/dt>/);
		assert.ok(html.indexOf('John Doe') < html.indexOf('Jane Roe'));
		assert.ok(html.indexOf('21 October 2026') < html.indexOf('5 November 2026'));
		assertStringOccursInHtmlExactlyOnce(html, `href="${removeLink}"`);
		assertStringOccursInHtmlExactlyOnce(html, `href="${secondRemoveLink}"`);
		assertStringOccursInHtmlExactlyOnce(html, 'data-cy="remove-assessor-1"');
		assertStringOccursInHtmlExactlyOnce(html, 'data-cy="remove-assessor-2"');
	});

	it('does not show the Assessors block when the tab has not provided an assessor link', () => {
		const html = renderOverview({}, ['Timetable', 'Gateway 2', 'Gateway 3']);

		assert.ok(!html.includes('>Assessors</h2>'));
		assert.ok(!html.includes('data-cy="add-assessor"'));
	});
});

describe('remove-assessor.njk', () => {
	it('asks for confirmation with the assessor name and ways back to the tab', () => {
		const html = configureNunjucks().render('views/layouts/remove-assessor.njk', {
			reference: 'PLAN-000001',
			assessorName: 'John <Doe>',
			assessorValue: 'assessor-"1"',
			backLink: '/case/PLAN-000001/gateway-3',
			cancelLink: '/case/PLAN-000001/gateway-3',
			formAction: '/case/PLAN-000001/gateway-3/assessor/remove/first'
		});

		assert.ok(html.includes('Remove assessor?</h1>'));
		assert.ok(html.includes('John &lt;Doe&gt;'));
		assert.ok(html.includes('<form method="post" action="/case/PLAN-000001/gateway-3/assessor/remove/first">'));
		assert.ok(html.includes('<input type="hidden" name="assessor" value="assessor-&quot;1&quot;">'));
		assert.match(html, /govuk-button--warning[^>]*>\s*Remove assessor\s*<\/button>/);
		assert.ok(html.includes('govuk-back-link'));
		assert.ok(
			html.includes('<a href="/case/PLAN-000001/gateway-3" class="govuk-link" data-cy="cancel-remove-assessor">')
		);
	});
});

describe('case-overview.njk assessors block', () => {
	const assessorLink = '/case/someCaseReference/gateway-2/assessor/assessors/assessor-gateway-2';
	const removeLink = '/case/someCaseReference/gateway-2/assessor/remove/first';
	const secondRemoveLink = '/case/someCaseReference/gateway-2/assessor/remove/second-assessor-id';

	function renderOverview(context: Record<string, unknown>, headings = ['Gateway 2', 'Workshop', 'Report']) {
		return configureNunjucks().render('views/layouts/case-overview.njk', {
			planTitle: 'somePlan',
			reference: 'someCaseReference',
			journeyResponse: { answers: { workshops: [], hearings: [] } },
			summaryListData: {
				sections: headings.map((heading) => ({ heading, list: { rows: [] } }))
			},
			...context
		});
	}

	it('shows the Assessors sub-heading and Add assessor link once, after the gateway section', () => {
		const html = renderOverview({ assessorLink, assessors: [] });

		assertStringOccursInHtmlExactlyOnce(html, '>Assessors</h2>');
		assertStringOccursInHtmlExactlyOnce(html, `<a href="${assessorLink}" class="govuk-link" data-cy="add-assessor">`);
		assert.ok(html.indexOf('>Gateway 2</h2>') < html.indexOf('>Assessors</h2>'));
		assert.ok(html.indexOf('>Assessors</h2>') < html.indexOf('>Workshop</h2>'));
	});

	it('shows the assessor and appointed rows with a Remove link once an assessor has been added', () => {
		const html = renderOverview({
			assessorLink,
			assessors: [{ number: 1, name: 'John Doe', appointedDate: '21 October 2026', removeLink }]
		});

		assertStringOccursInHtmlExactlyOnce(html, '>Assessors</h2>');
		assert.match(html, /Assessor 1\s*<\/dt>/);
		assert.match(html, /Assessor 1 appointed\s*<\/dt>/);
		assert.ok(html.includes('John Doe'));
		assert.ok(html.includes('21 October 2026'));
		assert.ok(html.includes(`href="${removeLink}"`));
		assert.ok(html.includes('data-cy="remove-assessor-1"'));
	});

	it('keeps the Add assessor link after the assessor rows so another assessor can be added', () => {
		const html = renderOverview({
			assessorLink,
			assessors: [{ number: 1, name: 'John Doe', appointedDate: '21 October 2026', removeLink }]
		});

		assertStringOccursInHtmlExactlyOnce(html, `<a href="${assessorLink}" class="govuk-link" data-cy="add-assessor">`);
		assert.ok(html.indexOf('data-cy="assessors-list"') < html.indexOf('data-cy="add-assessor"'));
		assert.ok(html.indexOf('data-cy="add-assessor"') < html.indexOf('>Workshop</h2>'));
	});

	it('shows each assessor in their own numbered rows with their own Remove link', () => {
		const html = renderOverview({
			assessorLink,
			assessors: [
				{ number: 1, name: 'John Doe', appointedDate: '21 October 2026', removeLink },
				{ number: 2, name: 'Jane Roe', appointedDate: '5 November 2026', removeLink: secondRemoveLink }
			]
		});

		assertStringOccursInHtmlExactlyOnce(html, '>Assessors</h2>');
		assertStringOccursInHtmlExactlyOnce(html, 'data-cy="assessors-list"');
		assert.match(html, /Assessor 1\s*<\/dt>/);
		assert.match(html, /Assessor 1 appointed\s*<\/dt>/);
		assert.match(html, /Assessor 2\s*<\/dt>/);
		assert.match(html, /Assessor 2 appointed\s*<\/dt>/);
		assert.ok(html.indexOf('John Doe') < html.indexOf('Jane Roe'));
		assert.ok(html.indexOf('21 October 2026') < html.indexOf('5 November 2026'));
		assertStringOccursInHtmlExactlyOnce(html, `href="${removeLink}"`);
		assertStringOccursInHtmlExactlyOnce(html, `href="${secondRemoveLink}"`);
		assertStringOccursInHtmlExactlyOnce(html, 'data-cy="remove-assessor-1"');
		assertStringOccursInHtmlExactlyOnce(html, 'data-cy="remove-assessor-2"');
	});

	it('does not show the Assessors block when the tab has not provided an assessor link', () => {
		const html = renderOverview({}, ['Timetable', 'Gateway 2', 'Gateway 3']);

		assert.ok(!html.includes('>Assessors</h2>'));
		assert.ok(!html.includes('data-cy="add-assessor"'));
	});
});

describe('remove-assessor.njk', () => {
	it('asks for confirmation with the assessor name and ways back to the tab', () => {
		const html = configureNunjucks().render('views/layouts/remove-assessor.njk', {
			reference: 'PLAN-000001',
			assessorName: 'John <Doe>',
			assessorValue: 'assessor-"1"',
			backLink: '/case/PLAN-000001/gateway-3',
			cancelLink: '/case/PLAN-000001/gateway-3',
			formAction: '/case/PLAN-000001/gateway-3/assessor/remove/first'
		});

		assert.ok(html.includes('Remove assessor?</h1>'));
		assert.ok(html.includes('John &lt;Doe&gt;'));
		assert.ok(html.includes('<form method="post" action="/case/PLAN-000001/gateway-3/assessor/remove/first">'));
		assert.ok(html.includes('<input type="hidden" name="assessor" value="assessor-&quot;1&quot;">'));
		assert.match(html, /govuk-button--warning[^>]*>\s*Remove assessor\s*<\/button>/);
		assert.ok(html.includes('govuk-back-link'));
		assert.ok(
			html.includes('<a href="/case/PLAN-000001/gateway-3" class="govuk-link" data-cy="cancel-remove-assessor">')
		);
	});
});

describe('case-overview.njk QA inspector block', () => {
	const qaInspectorLink = '/case/someCaseReference/examination/qa-inspector/qa-inspector/who-is-the-qa-inspector';
	const qaInspectorRemoveLink = '/case/someCaseReference/examination/qa-inspector/remove/qa-1';
	const qaInspectorRemoveLink2 = '/case/someCaseReference/examination/qa-inspector/remove/qa-2';

	function renderQaInspectorOverview(context: Record<string, unknown>) {
		return configureNunjucks().render('views/layouts/case-overview.njk', {
			planTitle: 'somePlan',
			reference: 'someCaseReference',
			journeyResponse: { answers: { workshops: [], hearings: [] } },
			summaryListData: {
				sections: [{ heading: 'QA', list: { rows: [] } }]
			},
			...context
		});
	}

	it('shows the Add QA inspector link on the QA section', () => {
		const html = renderQaInspectorOverview({ qaInspectorLink, qaInspectors: [] });

		assertStringOccursInHtmlExactlyOnce(
			html,
			`<a href="${qaInspectorLink}" class="govuk-link" data-cy="add-qa-inspector">Add QA inspector</a>`
		);
	});

	it('shows the numbered QA inspector rows and their appointment dates with a Remove link', () => {
		const html = renderQaInspectorOverview({
			qaInspectorLink,
			qaInspectors: [
				{ number: 1, name: 'Jane Inspector', appointedDate: '24 November 2026', removeLink: qaInspectorRemoveLink }
			]
		});

		assert.match(html, /QA inspector 1\s*<\/dt>/);
		assert.match(html, /QA inspector 1 appointed\s*<\/dt>/);
		assert.ok(html.includes('Jane Inspector'));
		assert.ok(html.includes('24 November 2026'));
		assert.ok(html.includes(`href="${qaInspectorRemoveLink}"`));
		assert.ok(html.includes('data-cy="remove-qa-inspector-1"'));
	});

	it('numbers each QA inspector with their own Remove link', () => {
		const html = renderQaInspectorOverview({
			qaInspectorLink,
			qaInspectors: [
				{ number: 1, name: 'Jane Inspector', appointedDate: '24 November 2026', removeLink: qaInspectorRemoveLink },
				{ number: 2, name: 'John Inspector', appointedDate: '25 November 2026', removeLink: qaInspectorRemoveLink2 }
			]
		});

		assert.ok(html.includes('Jane Inspector'));
		assert.ok(html.includes('John Inspector'));
		assert.ok(html.includes('data-cy="remove-qa-inspector-2"'));
	});

	it('does not show the QA inspector block when the tab handler provides no data', () => {
		const html = renderQaInspectorOverview({});

		assert.equal(html.includes('Add QA inspector'), false);
		assert.equal(html.includes('data-cy="remove-qa-inspector-1"'), false);
	});

	it('shows the Add QA inspector link between the QA title and the QA rows when no inspector exists', () => {
		const html = renderQaInspectorOverview({
			qaInspectorLink,
			qaInspectors: [],
			summaryListData: {
				sections: [
					{
						heading: 'QA',
						list: {
							rows: [
								{
									key: { text: 'Report sent to QA panel' },
									value: { text: 'Not provided' },
									actions: { items: [{ text: 'Answer', href: '/some-answer-link' }] }
								}
							]
						}
					}
				]
			}
		});

		const titleIndex = html.indexOf('<h2 class="govuk-heading-l">QA</h2>');
		const linkIndex = html.indexOf('data-cy="add-qa-inspector"');
		const rowIndex = html.indexOf('Report sent to QA panel');
		assert.notEqual(titleIndex, -1);
		assert.notEqual(linkIndex, -1);
		assert.notEqual(rowIndex, -1);
		assert.ok(titleIndex < linkIndex && linkIndex < rowIndex, 'expected QA title, then Add link, then QA rows');
	});

	it('shows the QA inspector list, then the Add QA inspector link, before the QA rows when an inspector exists', () => {
		const html = renderQaInspectorOverview({
			qaInspectorLink,
			qaInspectors: [
				{ number: 1, name: 'Anisha Sharma', appointedDate: '12 November 2026', removeLink: qaInspectorRemoveLink }
			],
			summaryListData: {
				sections: [
					{
						heading: 'QA',
						list: {
							rows: [
								{
									key: { text: 'Report sent to QA panel' },
									value: { text: 'Not provided' },
									actions: { items: [{ text: 'Answer', href: '/some-answer-link' }] }
								}
							]
						}
					}
				]
			}
		});

		const titleIndex = html.indexOf('<h2 class="govuk-heading-l">QA</h2>');
		const inspectorIndex = html.indexOf('Anisha Sharma');
		const linkIndex = html.indexOf('data-cy="add-qa-inspector"');
		const rowIndex = html.indexOf('Report sent to QA panel');
		assert.notEqual(titleIndex, -1);
		assert.notEqual(inspectorIndex, -1);
		assert.notEqual(linkIndex, -1);
		assert.notEqual(rowIndex, -1);
		assert.ok(
			titleIndex < inspectorIndex && inspectorIndex < linkIndex && linkIndex < rowIndex,
			'expected QA title, then inspector list, then Add link, then QA rows'
		);
	});
});
