import { BasePage } from '../../base-page.ts';

export class Gateway1DsaPage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/gateway-1\/gateway-1\/dsa-checked$/);
	}

	dsaOption(value: string) {
		return cy.get(`input[name="dsaChecked"][value="${value}"]`);
	}

	dsaOptionLabel(value: string) {
		return this.dsaOption(value).siblings('label');
	}

	verifyLoaded(value?: string) {
		super.verifyLoaded();
		this.verifyHeading('Does the LPA have a Digital Sharing Agreement (DSA)?');
		this.dsaOptionLabel('yes').should('be.visible').and('contain.text', 'Yes');
		this.dsaOptionLabel('no').should('be.visible').and('contain.text', 'No');
		this.verifySaveAndContinueVisible();

		if (value) {
			this.dsaOption(value).should('be.checked');
		}
	}

	selectAnswer(value: string) {
		this.dsaOption(value).check({ force: true });
		this.saveAndContinue();
	}
}

export const gateway1DsaPage = new Gateway1DsaPage();
