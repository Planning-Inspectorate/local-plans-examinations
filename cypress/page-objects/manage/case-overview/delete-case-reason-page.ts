import { BasePage } from '../../base-page.ts';
import { deleteCaseReason } from '../../../fixtures/manage/overview.ts';

export class DeleteCaseReasonPage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/delete-case\/delete-case-reason$/);
	}

	get deleteReasonInput() {
		return cy.getByData('delete-case-reason');
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading(deleteCaseReason.heading);
		this.deleteReasonInput.should('be.visible');
		this.verifySaveAndContinueVisible();
		this.saveAndContinueButton.invoke('text').should('match', /^\s*Continue\s*$/);
	}

	enterDeleteReason(deleteReason: string) {
		this.deleteReasonInput.clearAndWrite(deleteReason);
		this.saveAndContinue();
	}

	verifyDeleteReason(deleteReason: string) {
		this.deleteReasonInput.should('have.value', deleteReason);
	}
}

export const deleteCaseReasonPage = new DeleteCaseReasonPage();
