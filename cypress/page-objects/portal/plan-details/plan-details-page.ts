import { PortalPlanBasePage } from '../base/portal-plan-page.ts';

export class PlanDetailsPage extends PortalPlanBasePage {
	constructor() {
		super();
	}

	pathFor(planReference: string) {
		return `/manage-local-plans/${planReference}`;
	}

	get actionButton() {
		return cy.getByData('plan-details-action');
	}

	get planProgress() {
		return cy.get('[data-cy="plan-progress"], section[aria-labelledby="plan-progress-heading"]');
	}

	get gateway2Link() {
		return this.planProgress.contains('a', 'Gateway 2');
	}

	get gateway3Link() {
		return this.planProgress.contains('a', 'Gateway 3');
	}

	get examinationLink() {
		return this.planProgress.contains('a', 'Examination');
	}

	verifyLoaded() {
		this.verifyPathMatches(/^\/manage-local-plans\/[^/]+$/);
		this.verifyPlanProgressHeading();
	}

	verifyAccessDenied(planReference: string) {
		const path = this.pathFor(planReference);
		cy.intercept('GET', path).as('inaccessiblePlan');
		cy.visit(path, { failOnStatusCode: false });
		cy.wait('@inaccessiblePlan').its('response.statusCode').should('eq', 404);
	}

	verifyBackLink(href: string | RegExp = '/manage-local-plans/your-plans') {
		super.verifyBackLink(href);
		this.backLink.should('have.text', 'Back to my plans');
	}

	verifyPlanningAuthorities(...names: string[]) {
		const key = names.length > 1 ? 'Joint local planning' : 'Local planning authority';
		this.verifyMetadataValue(key, ...names);
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
		return this.planProgress.contains('.govuk-task-list__item', title);
	}

	verifyProgressRow(title: string, hint: string, status: string) {
		const row = this.progressRow(title).should('be.visible');

		row.should('contain.text', title);
		row.should('contain.text', hint);
		row.should('contain.text', status);
	}
}

export const planDetailsPage = new PlanDetailsPage();
