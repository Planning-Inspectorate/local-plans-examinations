import { PortalPlanBasePage } from '../../../page-objects/portal/base/portal-plan-page.ts';
import { gateway2ApplicationPage } from '../gw2-application/gateway-2-application-page.ts';

export class DocumentUploadBasePage extends PortalPlanBasePage {
	get chooseFilesButton() {
		return cy.getByData('');
	}

	get continueButton() {
		return cy.getByData('');
	}

	get returnToYourApplicationLink() {
		return cy.getByData('');
	}

	get hintText() {
		return cy.getByData('');
	}

	uploadFile(fileName: string) {
		this.chooseFilesButton.selectFile(`cypress/fixtures/portal/files/${fileName}`);
	}

	verifyFileFormatHintText() {
		this.hintText.should('have.text', '');
	}

	verifyReturnToApplicationLink(planReference: string) {
		this.returnToYourApplicationLink
			.should('be.visible')
			.and('have.attr', 'href', gateway2ApplicationPage.pathFor(planReference));
	}

	verifyContinueButton() {
		this.continueButton.should('be.visible');
	}

	// verifyFileUploaded(fileName: string) {
	//     // do this
	//     this.fileName.should('be.visible');
	// }
}
