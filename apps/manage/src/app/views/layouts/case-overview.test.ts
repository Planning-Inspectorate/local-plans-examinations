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
