import { PortalPlanBasePage } from '../base/portal-plan-page.ts';

export class Gateway3DeclarationPage extends PortalPlanBasePage {
	constructor() {
		super(/^\/manage-local-plans\/[^/]+\/gateway-3-submission\/declaration$/);
	}

	pathFor(planReference: string) {
		return `/manage-local-plans/${planReference}/gateway-3-submission/declaration`;
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading("Are you sure you're ready to submit?");
		this.verifyMainContains("This can't be undone.");
	}

	get confirmSubmissionButton() {
		return cy.getByData('confirm-submission');
	}

	verifyConfirmSubmissionButton() {
		this.confirmSubmissionButton.should('be.visible');
	}
}

export const gateway3DeclarationPage = new Gateway3DeclarationPage();
