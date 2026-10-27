import { examinationApplicationDocuments } from '../../../fixtures/portal/examination-uploads.ts';
import { PortalPlanBasePage } from '../base/portal-plan-page.ts';

const examinationHeading = 'Examination';

export class ExaminationPage extends PortalPlanBasePage {
	constructor() {
		super(/^\/manage-local-plans\/[^/]+\/examination$/);
	}

	pathFor(planReference: string) {
		return `/manage-local-plans/${planReference}/examination`;
	}

	get saveAndComeBackLink() {
		return cy.getByData('save-and-come-back');
	}

	get statusTag() {
		return cy.get('.govuk-tag');
	}

	get checkTheGuidanceLink() {
		return cy.get('.govuk-inset-text .govuk-link');
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

	verifyStatusTag(status: string) {
		this.statusTag.should('be.visible').and('contain.text', status);
	}

	verifyCheckTheGuidanceLink() {
		this.checkTheGuidanceLink
			.should('be.visible')
			.and('contain.text', 'check the guidance')
			.and('have.attr', 'href', `/guidance`);
	}

	verifyRequiredDocuments() {
		this.examinationDetailsTable.within(() => {
			examinationApplicationDocuments.required.forEach(({ document, addCy }) => {
				cy.contains('tr', document).within(() => {
					cy.get('.govuk-hint').should('be.visible').and('have.text', 'Required');
					cy.getByData(addCy).should('be.visible');
				});
			});
		});
	}

	verifyOptionalDocuments() {
		this.examinationDetailsTable.within(() => {
			examinationApplicationDocuments.optional.forEach(({ document, addCy }) => {
				cy.contains('tr', document).within(() => {
					cy.get('.govuk-hint').should('not.exist');
					cy.getByData(addCy).should('be.visible');
				});
			});
		});
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
