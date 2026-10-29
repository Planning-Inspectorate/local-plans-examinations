import { BasePage } from '../../base-page.ts';
import { deleteCaseConfirmation, deleteCaseReason } from '../../../fixtures/manage/overview.ts';

export class DeleteCasePage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/delete-case\/check$/);
	}

	get deleteCaseButton() {
		return cy.getByData('confirm-delete-button');
	}

	get cancelLink() {
		return cy.getByData('cancel-delete');
	}

	get caseDetailsList() {
		return cy.getByData('delete-case-details');
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading(deleteCaseConfirmation.heading);
		this.verifyMainContains(deleteCaseConfirmation.body, deleteCaseConfirmation.caseDetailsHeading);
		this.caseDetailsList.should('be.visible');
	}

	verifyCaseDetails(planTitle: string, planType: string, localPlanningAuthority: string, caseOfficer: string) {
		this.verifyCaseReference();
		this.verifySummaryRowContains('Title', planTitle);
		this.verifySummaryRowContains('Type', planType);
		this.verifySummaryRowContains('Planning authority', localPlanningAuthority);
		this.verifySummaryRowContains('Case officer', caseOfficer);
	}

	verifyCaseReference() {
		this.summaryRowValue('Reference')
			.invoke('text')
			.should('match', /PLAN-\d+/);
	}

	verifyDeleteReason(deleteReason: string) {
		this.verifySummaryRowContains(deleteCaseReason.row, deleteReason);
		this.verifySummaryRowActionHref(deleteCaseReason.row, /^\/case\/.+\/delete-case\/delete-case-reason$/);
	}

	changeDeleteReason() {
		this.summaryRowActionLink(deleteCaseReason.row).should('be.visible').click();
	}

	cancel() {
		this.cancelLink.should('be.visible').click();
	}

	deleteCase() {
		this.deleteCaseButton.should('be.visible').click();
	}
}

export const deleteCasePage = new DeleteCasePage();
