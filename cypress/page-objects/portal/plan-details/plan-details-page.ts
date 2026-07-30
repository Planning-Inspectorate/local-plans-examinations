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
		return cy.get('section[aria-labelledby="plan-progress-heading"]');
	}

	get gateway2Link() {
		return cy.contains('a', 'Gateway 2 - advisory check');
	}

	verifyLoaded() {
		this.verifyPathMatches(/^\/manage-local-plans\/[^/]+$/);
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
}

export const planDetailsPage = new PlanDetailsPage();
