import { BasePage } from '../base-page.ts';

export class PortalOtpPage extends BasePage {
	constructor() {
		super('/login/enter-code');
	}

	get otpInput() {
		return cy.get('#otp');
	}

	get hintText() {
		return cy.get('.govuk-hint');
	}

	get requestNewCodeLink() {
		return cy.get('a[href*="request-new-code"]');
	}

	get detailsSummary() {
		return cy.get('.govuk-details__summary');
	}

	get notificationBanner() {
		return cy.get('.govuk-notification-banner');
	}

	enterOtp(code: string) {
		this.otpInput.clear().type(code);
	}

	clickRequestNewCode() {
		this.requestNewCodeLink.click();
	}

	verifyHintText(text: string) {
		this.hintText.should('be.visible').and('contain.text', text);
	}

	verifyNewCodeBanner() {
		this.notificationBanner.should('be.visible');
	}

	verifyDetailsComponent(summaryText: string) {
		this.detailsSummary.should('be.visible').and('contain.text', summaryText);
	}
}

export const portalOtpPage = new PortalOtpPage();
