import { BasePage } from '../../base-page.ts';

export class GatewayBasePage extends BasePage {
	sectionHeading(text: string) {
		return cy.contains('h2', text);
	}

	openActionLinkFor(key: string) {
		this.summaryRowActionLink(key).should('be.visible').click();
	}

	verifyLoaded(planTitle?: string) {
		super.verifyLoaded();
		if (planTitle) {
			this.verifyHeading(planTitle);
		}
	}

	verifySectionHeading(text: string) {
		this.sectionHeading(text).should('be.visible');
	}

	verifyHeaderStatus(status: string) {
		cy.getByData('status-tag').should('be.visible').and('contain.text', status);
	}

	get assessorsSection() {
		return cy.getByData('assessors-section');
	}

	get addAssessorLink() {
		return cy.getByData('add-assessor');
	}

	removeAssessorLink(assessorNumber = 1) {
		return cy.getByData(`remove-assessor-${assessorNumber}`);
	}

	verifyAssessorsHeading() {
		this.assessorsSection.contains('h2', 'Assessors').should('be.visible');
	}

	verifyAddAssessorLink(href: RegExp) {
		this.verifyAssessorsHeading();
		this.addAssessorLink
			.should('be.visible')
			.and('have.text', 'Add assessor')
			.and('have.attr', 'href')
			.and('match', href);
	}

	openAddAssessor() {
		this.addAssessorLink.should('be.visible').click();
	}

	verifyAssessor(assessorNumber: number, name: string, appointedDate: string, removeHref?: RegExp) {
		this.verifyAssessorsHeading();
		this.assessorsSection.within(() => {
			this.verifySummaryRowContains(`Assessor ${assessorNumber}`, name);
			this.verifySummaryRowContains(`Assessor ${assessorNumber} appointed`, appointedDate);
		});
		this.removeAssessorLink(assessorNumber).should('be.visible').and('contain.text', 'Remove');
		if (removeHref) {
			this.removeAssessorLink(assessorNumber).should('have.attr', 'href').and('match', removeHref);
		}
		this.addAssessorLink.should('not.exist');
	}

	verifyNoAssessor() {
		this.verifyAssessorsHeading();
		this.assessorsSection.find('.govuk-summary-list').should('not.exist');
		this.removeAssessorLink().should('not.exist');
		this.addAssessorLink.should('be.visible');
	}

	openRemoveAssessor(assessorNumber = 1) {
		this.removeAssessorLink(assessorNumber).should('be.visible').click();
	}
}
