import { BasePage } from '../base-page.ts';

export class PortalLandingPage extends BasePage {
	constructor() {
		super('/landingPage');
	}

	verifyHeading(text: string) {
		cy.get('h1').should('contain.text', text);
	}
}

export const portalLandingPage = new PortalLandingPage();
