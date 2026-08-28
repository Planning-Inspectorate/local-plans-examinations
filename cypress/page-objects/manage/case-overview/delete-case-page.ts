import { BasePage } from '../../base-page.ts';

export class DeleteCasePage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/delete-case$/);
	}

	get deleteCaseButton() {
		return cy.getByData('confirm-delete-button');
	}

	get table() {
		return cy.getByData('delete-case-details');
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading('Are you sure you want to delete this case?');
		this.verifyMainContains(
			'This will mark the case as deleted. It will no longer appear in the system but will still be available for audit purposes.',
			'Case details'
		);
	}

	caseDetailRow(label: string) {
		return this.table.contains('tr', label);
	}

	verifyCaseDetails(planTitle: string, planType: string, localPlanningAuthority: string, caseOfficer: string) {
		this.verifyCaseReference();
		this.caseDetailRow('Plan title').should('contain.text', planTitle);
		this.caseDetailRow('Plan type').should('contain.text', planType);
		this.caseDetailRow('LPA').should('contain.text', localPlanningAuthority);
		this.caseDetailRow('Case officer').should('contain.text', caseOfficer);
	}

	verifyCaseReference() {
		this.caseDetailRow('Case reference')
			.invoke('text')
			.should('match', /PLAN-\d+/);
	}

	deleteCase() {
		this.deleteCaseButton.should('be.visible').click();
	}
}

export const deleteCasePage = new DeleteCasePage();
