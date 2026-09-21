import { BasePage } from '../../../page-objects/base-page.ts';

export class PortalHeaderAndFooter extends BasePage {
	serviceInformationLink(item: string) {
		return cy.getByData(item);
	}

	verifyServiceInformation(...links: string[]) {
		cy.contains('h3', 'Service information').should('be.visible');
		links.forEach((link) => {
			this.serviceInformationLink(link).should('be.visible');
		});
	}
}

export const portalHeaderAndFooter = new PortalHeaderAndFooter();
