import { PortalPlanBasePage } from './base/portal-plan-page.ts';
export class PortalLandingPage extends PortalPlanBasePage {
	constructor() {
		super('/manage-local-plans/your-plans');
	}

	visit() {
		cy.visit('/manage-local-plans/your-plans');
	}

	openPlan(reference: string) {
		cy.contains('[data-cy="plan-link"]', reference).should('be.visible').click();
	}
}

export const portalLandingPage = new PortalLandingPage();
