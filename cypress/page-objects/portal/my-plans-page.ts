import { PortalPlanBasePage } from './base/portal-plan-page.ts';

const myPlansHeading = 'My plans';

export class MyPlansPage extends PortalPlanBasePage {
	constructor() {
		super('/manage-local-plans/your-plans');
	}

	get myPlansTable() {
		return cy.get('.govuk-table');
	}

	visit() {
		cy.visit('/manage-local-plans/your-plans');
	}

	openPlan(refNumber: string) {
		cy.contains('[data-cy="plan-link"]', refNumber).should('be.visible').click();
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading(myPlansHeading);
	}

	verifyYourPlanLink(refNumber: string) {
		return cy
			.contains('[data-cy="plan-link"]', refNumber)
			.should('have.attr', 'href', `/manage-local-plans/${encodeURIComponent(refNumber)}`);
	}

	verifyPlanOrder(references: string[]) {
		references.forEach((refNumber, index) => {
			cy.get('[data-cy="plan-link"]').eq(index).should('contain.text', refNumber);
		});
	}

	verifyPlanListed(refNumber: string) {
		cy.contains('[data-cy="plan-link"]', refNumber).should('be.visible');
	}

	verifyPlanNotListed(refNumber: string) {
		cy.contains('[data-cy="plan-link"]', refNumber).should('not.exist');
	}

	verifyTableRows(
		table: Cypress.Chainable,
		rows: {
			refNumber: string;
			localPlanningAuthority: string;
			planTitle: string;
			currentStage: string;
			status: string;
		}[]
	) {
		table.within(() => {
			rows.forEach(({ refNumber, localPlanningAuthority, planTitle, currentStage, status }) => {
				const row = cy.contains('tr', refNumber);
				row.should('be.visible');
				row.should('contain.text', localPlanningAuthority);
				row.should('contain.text', planTitle);
				row.should('contain.text', currentStage);
				row.should('contain.text', status);
			});
		});
	}
}

export const myPlansPage = new MyPlansPage();
