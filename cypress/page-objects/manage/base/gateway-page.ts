import { BasePage } from '../../base-page.ts';

export class GatewayBasePage extends BasePage {
	sectionHeading(text: string) {
		return cy.contains('h2', text);
	}

	openActionLinkFor(key: string) {
		this.summaryRowActionLink(key).should('be.visible').click();
	}

	verifyLoaded(planTitle?: string) {
		super.verifyLoaded();
		if (planTitle) {
			this.verifyHeading(planTitle);
		}
	}

	verifySectionHeading(text: string) {
		this.sectionHeading(text).should('be.visible');
	}
}
