import { PortalPlanBasePage } from '../base/portal-plan-page.ts';

const examinationHeading = 'Examination';

export class ExaminationPage extends PortalPlanBasePage {
	constructor() {
		super(/^\/manage-local-plans\/[^/]+\/examination-submission$/);
	}

	pathFor(planReference: string) {
		return `/manage-local-plans/${planReference}/examination-submission`;
	}

	get saveAndComeBackLink() {
		return cy.getByData('save-and-come-back');
	}

	get examinationDetailsTable() {
		return cy.getByData('examination-details-table');
	}

	get submitExaminationButton() {
		return cy.getByData('submit-examination');
	}

	get readyToSubmitHeading() {
		return cy.getByData('ready-to-submit-section');
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading(examinationHeading);
	}

	verifySaveAndComeBackLink(href: string) {
		this.saveAndComeBackLink
			.should('be.visible')
			.and('contain.text', 'Save and come back later')
			.and('have.attr', 'href', href);
	}

	verifySubmitExaminationButton() {
		this.submitExaminationButton.should('be.visible').and('contain.text', 'Submit').and('have.attr', 'type', 'submit');
	}

	verifySubmissionData(todayDisplay: string, submitterEmail: string) {
		cy.getByData('submission-copy')
			.should('be.visible')
			.invoke('text')
			.should('match', /^Your submission was sent on .+ at \d{2}:\d{2} by .+$/)
			.and('include', todayDisplay)
			.and('include', submitterEmail);
	}

	verifyNoAddOrChangeLinks() {
		cy.get('[data-cy^="add-"]').should('not.exist');
		cy.contains('a', 'Change').should('not.exist');
	}

	verifySubmitExaminationNotShown() {
		this.submitExaminationButton.should('not.exist');
	}
}

export const examinationPage = new ExaminationPage();
