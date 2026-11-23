import { PortalPlanBasePage } from '../base/portal-plan-page.ts';
import { gateway3ApplicationDocuments } from '../../../fixtures/portal/gateway-3-uploads.ts';

const gateway3SubmissionHeading = 'Gateway 3 submission';

export class Gateway3ApplicationPage extends PortalPlanBasePage {
	constructor() {
		super(/^\/manage-local-plans\/[^/]+\/gateway-3-submission$/);
	}

	pathFor(planReference: string) {
		return `/manage-local-plans/${planReference}/gateway-3-submission`;
	}

	get saveAndComeBackLink() {
		return cy.getByData('save-and-come-back');
	}

	get proceduralDocumentsTable() {
		return cy.getByData('procedural-documents-section');
	}

	get consultationDocumentsTable() {
		return cy.getByData('consultation-documents-section');
	}

	get planContentEvidenceBackgroundTable() {
		return cy.getByData('plan-content-evidence-and-background-section');
	}

	get checkTheGuidanceLink() {
		return cy.get('.govuk-inset-text .govuk-link');
	}

	get submitGateway3Button() {
		return cy.getByData('submit-gateway-3');
	}

	get readyToSubmitHeading() {
		return cy.getByData('ready-to-submit-section');
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading(gateway3SubmissionHeading);
	}

	verifyCheckTheGuidanceLink() {
		this.checkTheGuidanceLink
			.should('be.visible')
			.and('contain.text', 'check the guidance')
			.and('have.attr', 'href', `/guidance`);
	}

	verifyProceduralDocuments() {
		this.verifyDocumentSection(
			this.proceduralDocumentsTable,
			'Procedural documents',
			gateway3ApplicationDocuments.procedural
		);
		this.verifyRequiredHints(this.proceduralDocumentsTable, [
			'Statement of compliance',
			'Statement of soundness',
			'Summary of consultation on proposed local plan'
		]);
	}

	verifyConsultationDocuments() {
		this.verifyDocumentSection(
			this.consultationDocumentsTable,
			'Consultation documents',
			gateway3ApplicationDocuments.consultation
		);
		this.verifyRequiredHints(this.consultationDocumentsTable, [
			'Summary of consultation and engagement activities in preparing the proposed local plan',
			'Summary of scoping consultation',
			'Summary of consultation on proposed local plan content and evidence'
		]);
	}

	verifyPlanContentEvidenceBackgroundDocuments() {
		this.verifyDocumentSection(
			this.planContentEvidenceBackgroundTable,
			'Plan content, evidence and background',
			gateway3ApplicationDocuments.planContentEvidenceBackground
		);
		this.verifyRequiredHints(this.planContentEvidenceBackgroundTable, [
			'Proposed local plan submission for examination',
			'Examination website',
			'Practical arrangements demonstrating readiness for examination',
			'Map of proposed local plan policies'
		]);
	}

	verifyRequiredHints(table: Cypress.Chainable, requiredDocuments: string[]) {
		table.within(() => {
			requiredDocuments.forEach((document) => {
				cy.contains('tr', document).find('.govuk-hint').should('have.text', 'Required');
			});
		});
	}

	verifySaveAndComeBackLink(href: string) {
		this.saveAndComeBackLink
			.should('be.visible')
			.and('contain.text', 'Save and come back later')
			.and('have.attr', 'href', href);
	}

	verifySubmitGateway3Button() {
		this.submitGateway3Button.should('be.visible').and('contain.text', 'Submit').and('have.attr', 'type', 'submit');
		this.readyToSubmitHeading
			.should('be.visible')
			.next('p.govuk-body')
			.should('contain.text', 'You cannot make any changes after submission.');
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

	verifySubmitGateway3ButtonNotShown() {
		this.submitGateway3Button.should('not.exist');
	}
}

export const gateway3ApplicationPage = new Gateway3ApplicationPage();
