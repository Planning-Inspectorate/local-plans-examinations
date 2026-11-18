import { PortalPlanBasePage } from '../base/portal-plan-page.ts';
import { gateway2ApplicationPage } from '../gw2-application/gateway-2-application-page.ts';

export class PortalDeclarationPage extends PortalPlanBasePage {
	constructor() {
		super(/^\/manage-local-plans\/[^/]+\/gateway-2\/declaration$/);
	}

	pathFor(planReference: string) {
		return `/manage-local-plans/${planReference}/gateway-2/declaration`;
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading("Are you sure you're ready to submit?");
	}

	get confirmSubmissionButton() {
		return cy.getByData('confirm-submission');
	}

	get noGoBackLink() {
		return cy.getByData('no-go-back');
	}

	verifyNoGoBackLink(urlReference: string) {
		this.noGoBackLink
			.should('be.visible')
			.and('contain.text', 'No, go back')
			.and('have.attr', 'href', gateway2ApplicationPage.pathFor(urlReference));
	}

	verifyConfirmSubmissionButton() {
		this.confirmSubmissionButton.should('be.visible').and('contain.text', 'Yes, confirm submission');
	}
}

export const portalDeclarationPage = new PortalDeclarationPage();
