import { BasePage } from '../base-page.ts';

export class PortalLandingPage extends BasePage {
	constructor() {
		super('/landingPage');
	}

	openPlan(reference: string) {
		cy.contains('[data-cy="plan-link"]', reference).should('be.visible').click();
	}
}

export const portalLandingPage = new PortalLandingPage();
