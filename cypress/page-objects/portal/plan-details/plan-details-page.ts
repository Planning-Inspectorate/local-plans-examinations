import { BasePage } from '../../base-page.ts';

export class PlanDetailsPage extends BasePage {
	constructor() {
		super();
	}

	get backLink() {
		return cy.getByData('back-link');
	}

	get actionButton() {
		return cy.getByData('plan-details-action');
	}

	get planProgress() {
		return cy.get('section[aria-labelledby="plan-progress-heading"]');
	}

	verifyLoaded() {
		this.verifyPathMatches(/^\/manage-local-plans\/[^/]+$/);
	}

	verifyBackLink(href: string) {
		this.backLink.should('be.visible').and('contain.text', 'Back to my plans').and('have.attr', 'href', href);
	}

	summaryRow(key: string) {
		return cy.contains('.govuk-summary-list__key', key).parent('.govuk-summary-list__row');
	}

	summaryRowValue(key: string) {
		return this.summaryRow(key).find('.govuk-summary-list__value');
	}

	verifyMetadataValue(key: string, ...expectedText: string[]) {
		const value = this.summaryRowValue(key).should('be.visible');

		expectedText.forEach((text) => {
			value.should('contain.text', text);
		});
	}

	verifyActionButton(text: string, href: string) {
		this.actionButton.should('be.visible').and('contain.text', text).and('have.attr', 'href', href);
	}

	verifyPlanProgressHeading() {
		this.planProgress.find('#plan-progress-heading').should('be.visible').and('contain.text', 'Plan progress');
	}

	progressRows() {
		return this.planProgress.find('.govuk-task-list__item');
	}

	verifyPlanProgressRowsInOrder(...stages: string[]) {
		this.progressRows().should('have.length', stages.length);

		stages.forEach((stage, index) => {
			this.progressRows().eq(index).should('contain.text', stage);
		});
	}

	progressRow(title: string) {
		return cy.contains('section[aria-labelledby="plan-progress-heading"] .govuk-task-list__item', title);
	}

	verifyProgressRow(title: string, hint: string, status: string) {
		const row = this.progressRow(title).should('be.visible');

		row.should('contain.text', title);
		row.should('contain.text', hint);
		row.should('contain.text', status);
	}

	pathFor(planReference: string) {
		return `/manage-local-plans/${planReference}`;
	}

	verifyPathForPlan(planReference: string) {
		this.verifyPath(this.pathFor(planReference));
	}
}

export const planDetailsPage = new PlanDetailsPage();
