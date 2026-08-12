import { GatewayBasePage } from '../base/gateway-page.ts';

export class ExaminationWebsitePage extends GatewayBasePage {
	constructor() {
		super(/^\/case\/.+\/examination\/examination-website\/examination-website$/);
	}

	get examinationWebsiteInput() {
		return cy.get('input[id="examinationWebsite"]');
	}

	verifyExaminationWebsiteForm(value?: string) {
		this.examinationWebsiteInput.should('be.visible');
		if (value) {
			this.examinationWebsiteInput.should('have.value', value);
		}
	}

	enterExaminationWebsite(value: string) {
		this.examinationWebsiteInput.clearAndWrite(value);
		this.saveAndContinue();
	}

	verifyLoaded(heading: string) {
		super.verifyLoaded(heading);
		super.verifySaveAndContinueVisible();
	}
}

export const examinationWebsitePage = new ExaminationWebsitePage();
