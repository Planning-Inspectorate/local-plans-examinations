import { BasePage } from 'cypress/page-objects/base-page.ts';

export class CaseOverviewExaminationWebsitePage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/overview\/contacts\/examination-website$/);
	}
	get examinationWebsiteInput() {
		return cy.get('input[name="examinationWebsite"]');
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading('What is the address of the examination website?');
		this.examinationWebsiteInput.should('be.visible').and('have.value', '');
		this.verifySaveAndContinueVisible();
	}

	enterExaminationWebsiteLink(websiteLink: string) {
		this.examinationWebsiteInput.clearAndWrite(websiteLink);
		this.saveAndContinue();
	}
}
export const caseOverviewExaminationWebsitePage = new CaseOverviewExaminationWebsitePage();
