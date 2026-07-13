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

	get insetText() {
		return cy.get('.govuk-inset-text');
	}

	get bodyText() {
		return cy.get('.govuk-body');
	}

	get confirmInformationLabel() {
		return cy.get('label[for="declaration"]');
	}

	get privacyNoteLabel() {
		return cy.get('label[for="declaration-2"]');
	}

	get privacyNoteLink() {
		return cy.get('a[href="https://www.gov.uk/government/publications/planning-inspectorate-privacy-notices"]');
	}

	get submissionReference() {
		return cy.contains('p', 'Submission reference');
	}

	verifyPrivacyNoteLink() {
		this.privacyNoteLink.should('be.visible').and('contain.text', 'privacy note');
	}

	verifyConfirmAndSubmitButton() {
		this.confirmAndSubmitButton.should('be.visible');
	}

	verifyConfirmInformationCheckbox(labelText: string) {
		this.confirmInformationCheckbox.should('exist').and('not.be.checked');
		this.confirmInformationLabel.should('contain.text', labelText);
	}

	verifyPrivacyNoteCheckbox(labelText: string) {
		this.privacyNoteCheckbox.should('exist').and('not.be.checked');
		this.privacyNoteLabel.should('contain.text', labelText);
	}

	verifyBodyText(text: string) {
		this.bodyText.should('be.visible').and('contain.text', text);
	}

	verifyInsetText(text: string) {
		this.insetText.should('be.visible').and('contain.text', text);
	}

	verifyBackLink(href: string) {
		this.backLink.should('be.visible').and('contain.text', 'Back').and('have.attr', 'href', href);
	}

	verifyCaption(reference: string) {
		this.pageHeading.find('.govuk-caption-xl').should('be.visible').and('contain.text', reference);
	}
}

export const portalDeclarationPage = new PortalDeclarationPage();
