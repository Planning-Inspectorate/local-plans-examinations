import { BasePage } from '../../base-page.ts';

class ExaminationReportRemovePage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/examination\/outcome\/examination-report\/remove\/.+$/);
	}

	get confirmButton() {
		return cy.getByData('confirm-remove-document');
	}

	get cancelButton() {
		return cy.getByData('cancel-remove-document');
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading('Remove document');
		this.confirmButton.should('be.visible');
		this.cancelButton.should('be.visible');
	}

	confirm(fileName: string) {
		this.verifyLoaded();
		this.verifyMainContains(fileName);
		this.confirmButton.click();
	}

	cancel(fileName: string) {
		this.verifyLoaded();
		this.verifyMainContains(fileName);
		this.cancelButton.click();
	}
}

export const examinationReportRemovePage = new ExaminationReportRemovePage();
