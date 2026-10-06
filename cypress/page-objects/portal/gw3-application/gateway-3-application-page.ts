import { PortalPlanBasePage } from '../base/portal-plan-page.ts';

const gateway3SubmissionHeading = 'Gateway 3 submission';

export class Gateway3ApplicationPage extends PortalPlanBasePage {
	constructor() {
		super(/^\/manage-local-plans\/[^/]+\/gateway-3-submission$/);
	}

	pathFor(planReference: string) {
		return `/manage-local-plans/${planReference}/gateway-3-submission`;
	}

	get saveAndComeBackLink() {
		return cy.getByData('save-and-come-back');
	}

	get requiredInformationTable() {
		return cy.getByData('required-information-section');
	}

	get optionalDocumentsTable() {
		return cy.getByData('optional-documents-section');
	}

	get submitGateway3Button() {
		return cy.getByData('submit-gateway-3');
	}

	get readyToSubmitHeading() {
		return cy.getByData('ready-to-submit-section');
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading(gateway3SubmissionHeading);
	}

	verifySaveAndComeBackLink(href: string) {
		this.saveAndComeBackLink
			.should('be.visible')
			.and('contain.text', 'Save and come back later')
			.and('have.attr', 'href', href);
	}

	verifySubmitGateway3Button() {
		this.submitGateway3Button.should('be.visible').and('contain.text', 'Submit').and('have.attr', 'type', 'submit');
	}
}

export const gateway3ApplicationPage = new Gateway3ApplicationPage();
