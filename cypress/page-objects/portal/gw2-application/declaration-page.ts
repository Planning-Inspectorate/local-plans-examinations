import { BasePage } from '../../base-page.ts';

export class PortalDeclarationPage extends BasePage {
	constructor() {
		super(/^\/manage-local-plans\/[^/]+\/gateway-2-application\/application-declaration$/);
	}

	pathFor(planReference: string) {
		return `/manage-local-plans/${planReference}/gateway-2-application/application-declaration`;
	}

	visit(planReference: string) {
		cy.visit(this.pathFor(planReference));
	}

	verifyLoaded() {
		this.verifyPath();
		this.verifyHeading('Review declaration');
	}

	get confirmAndSubmitButton() {
		return cy.contains('button[type="submit"]', 'Confirm and submit');
	}

	get confirmInformationCheckbox() {
		return cy.get('#declaration');
	}

	get privacyNoteCheckbox() {
		return cy.get('#declaration-2');
	}

	get confirmInformationLabel() {
		return cy.get('label[for="declaration"]');
	}

	get privacyNoteLabel() {
		return cy.get('label[for="declaration-2"]');
	}

	get privacyNoteLink() {
		return cy.get(
			'a[href="https://www.gov.uk/government/publications/planning-inspectorate-privacy-notices/customer-privacy-notice"]'
		);
	}

	verifyPrivacyNoteLink() {
		this.privacyNoteLink.should('be.visible').and('contain.text', 'privacy note');
	}

	verifyConfirmAndSubmitButton() {
		this.confirmAndSubmitButton.should('be.visible');
	}
}

export const portalDeclarationPage = new PortalDeclarationPage();
