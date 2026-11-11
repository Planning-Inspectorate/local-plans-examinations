import { BasePage } from '../../base-page.ts';

/**
 * The "Confirm and send notification" page shown after choosing an assessor for a gateway.
 */
export class AssessorConfirmPage extends BasePage {
	private readonly questionPath: RegExp;

	constructor(path: RegExp, questionPath: RegExp) {
		super(path);
		this.questionPath = questionPath;
	}

	get confirmAndSendButton() {
		return cy.getByData('issue-document-notification');
	}

	verifyLoaded(assessorName?: string, dateAppointed?: string) {
		super.verifyLoaded();
		this.verifyHeading('Confirm and send notification');
		this.confirmAndSendButton.should('be.visible').and('contain.text', 'Confirm and send');

		if (assessorName) {
			this.verifySummaryRowContains('Assessor', assessorName);
		}
		if (dateAppointed) {
			this.verifySummaryRowContains('Date appointed', dateAppointed);
		}
	}

	verifyContent(assessorName: string, dateAppointed: string) {
		this.verifyLoaded(assessorName, dateAppointed);
		this.verifySummaryRowActionHref('Assessor', this.questionPath);
		this.verifyMainContains('A notification will be sent to the assessor and the planning authority.');
		this.verifyBackLink(this.questionPath);
	}

	changeAssessor() {
		this.summaryRowActionLink('Assessor').should('be.visible').click();
	}

	confirmAndSend() {
		this.confirmAndSendButton.should('be.visible').click();
	}
}

/**
 * The "Remove assessor?" page opened from the Remove link of an assessor on a gateway tab.
 */
export class RemoveAssessorPage extends BasePage {
	private readonly tabPath: RegExp;

	constructor(path: RegExp, tabPath: RegExp) {
		super(path);
		this.tabPath = tabPath;
	}

	get removeAssessorButton() {
		return cy.getByData('confirm-remove-assessor');
	}

	get cancelLink() {
		return cy.getByData('cancel-remove-assessor');
	}

	get assessorName() {
		return cy.getByData('remove-assessor-name');
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading('Remove assessor?');
		this.removeAssessorButton.should('be.visible');
	}

	verifyContent(assessorName: string) {
		this.verifyLoaded();
		this.assessorName.should('be.visible').and('contain.text', assessorName);
		this.removeAssessorButton.should('contain.text', 'Remove assessor').and('have.class', 'govuk-button--warning');
		this.cancelLink.should('be.visible').and('have.text', 'Cancel').and('have.attr', 'href').and('match', this.tabPath);
		this.verifyBackLink(this.tabPath);
	}

	confirmRemoval() {
		this.verifyLoaded();
		this.removeAssessorButton.click();
	}

	cancelRemoval() {
		this.verifyLoaded();
		this.cancelLink.should('be.visible').click();
	}
}
