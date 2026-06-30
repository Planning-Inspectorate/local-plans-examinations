export class PortalCookieBanner {
	get banner() {
		return cy.get('.govuk-cookie-banner');
	}

	get acceptButton() {
		return cy.get('[data-cookie-action="accept"]');
	}

	get rejectButton() {
		return cy.get('[data-cookie-action="reject"]');
	}

	get viewCookiesLink() {
		return this.banner.contains('a', 'View cookies');
	}

	acceptAnalyticsCookies() {
		this.acceptButton.should('be.visible').click();
	}

	rejectAnalyticsCookies() {
		this.rejectButton.should('be.visible').click();
	}

	viewCookies() {
		this.viewCookiesLink.should('be.visible').click();
	}

	verifyVisible() {
		this.banner.should('be.visible');
	}

	verifyHidden() {
		this.banner.should('not.be.visible');
	}

	verifyConsentCookie(value: 'accept' | 'reject') {
		cy.getCookie('cookie_consent').should('include', { value });
	}
}

export const portalCookieBanner = new PortalCookieBanner();
