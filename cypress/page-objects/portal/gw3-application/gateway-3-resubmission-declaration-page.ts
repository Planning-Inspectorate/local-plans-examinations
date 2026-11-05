import { PortalPlanBasePage } from '../base/portal-plan-page.ts';

export class Gateway3ResubmissionDeclarationPage extends PortalPlanBasePage {
	constructor() {
		super(/^\/manage-local-plans\/[^/]+\/gateway-3-resubmission\/declaration$/);
	}

	pathFor(planReference: string) {
		return `/manage-local-plans/${planReference}/gateway-3-resubmission/declaration`;
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading("Are you sure you're ready to submit?");
		this.verifyMainContains("This can't be undone.");
	}

	get confirmSubmissionButton() {
		return cy.getByData('confirm-submission');
	}

	get goBackButton() {
		return cy.getByData('no-go-back');
	}

	verifyConfirmSubmissionButton() {
		this.confirmSubmissionButton.should('be.visible');
	}

	verifyGoBackButton() {
		this.goBackButton.should('be.visible');
	}
}

export const gateway3ResubmissionDeclarationPage = new Gateway3ResubmissionDeclarationPage();
