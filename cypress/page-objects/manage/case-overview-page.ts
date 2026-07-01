import { BasePage } from '../base-page.ts';

export class CaseOverviewPage extends BasePage {
	get serviceNavigation() {
		return cy.getByData('service-navigation');
	}

	verifyLoaded(planTitle?: string) {
		this.verifyPathMatches(/^\/case\/.+/);

		if (planTitle) {
			this.verifyHeading(planTitle);
		}
	}

	verifyServiceNavigation(...items: string[]) {
		const serviceNavigation = this.serviceNavigation.should('be.visible');

		items.forEach((item) => {
			serviceNavigation.should('contain.text', item);
		});
	}
}

export const caseOverviewPage = new CaseOverviewPage();
