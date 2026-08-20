import { BasePage } from '../../base-page.ts';
import { examinationWebsite } from '../../../fixtures/manage/overview.ts';

export class CaseOverviewExaminationWebsitePage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/overview\/contacts\/examination-website$/);
	}
	get examinationWebsiteInput() {
		return cy.get(`input[name="${examinationWebsite.field}"]`);
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading(examinationWebsite.heading);
		this.examinationWebsiteInput.should('be.visible').and('have.value', '');
		this.verifySaveAndContinueVisible();
	}

	enterExaminationWebsiteLink(websiteLink: string) {
		this.examinationWebsiteInput.clearAndWrite(websiteLink);
		this.saveAndContinue();
	}
}
export const caseOverviewExaminationWebsitePage = new CaseOverviewExaminationWebsitePage();
