import { BasePage } from '../base-page.ts';

export class PortalOtpPage extends BasePage {
	constructor() {
		super('/login/enter-code');
	}

	get otpInput() {
		return cy.getByData('otp');
	}

	get hintText() {
		return cy.getByData('otp-hint');
	}

	get requestNewCodeLink() {
		return cy.getByData('request-new-code');
	}

	get supportDetails() {
		return cy.getByData('support-details');
	}

	get notificationBanner() {
		return cy.getByData('new-code-banner');
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
		this.supportDetails.should('be.visible').and('contain.text', summaryText);
	}
}

export const portalOtpPage = new PortalOtpPage();
