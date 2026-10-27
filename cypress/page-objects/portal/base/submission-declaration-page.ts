import { PortalPlanBasePage } from './portal-plan-page.ts';

export class SubmissionDeclarationPage extends PortalPlanBasePage {
	private readonly journey: string;

	constructor(journey: string) {
		super(new RegExp(`^/manage-local-plans/[^/]+/${journey}/declaration$`));
		this.journey = journey;
	}

	pathFor(planReference: string) {
		return `/manage-local-plans/${planReference}/${this.journey}/declaration`;
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading("Are you sure you're ready to submit?");
		this.verifyMainContains("This can't be undone.");
	}

	get confirmSubmissionButton() {
		return cy.getByData('confirm-submission');
	}

	get GoBackButton() {
		return cy.getByData('no-go-back');
	}

	verifyConfirmSubmissionButton() {
		this.confirmSubmissionButton.should('be.visible');
	}

	verifyGoBackButton() {
		this.GoBackButton.should('be.visible');
	}
}
