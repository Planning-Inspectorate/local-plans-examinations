import { PortalPlanBasePage } from '../base/portal-plan-page.ts';
import { gateway2ApplicationDocuments, gateway2SubmittedPlan } from '../../../fixtures/portal/gateway-2-uploads.ts';

const gateway2SubmissionRows = ['Gateway 2 cover letter', 'Local plan timetable', 'Project initiation document'];
const gateway2SubmissionHeading = 'Gateway 2 submission';
const readyToSubmitGateway2Heading = 'Ready to submit for Gateway 2';
const notAddedStatus = 'Not added';
const submitButtonText = 'Submit';

export class Gateway2ApplicationPage extends PortalPlanBasePage {
	constructor() {
		super(/^\/manage-local-plans\/[^/]+\/gateway-2-submission$/);
	}

	pathFor(planReference: string) {
		return `/manage-local-plans/${planReference}/gateway-2-submission`;
	}

	get saveAndComeBackLink() {
		return cy.getByData('save-and-come-back');
	}

	get submitGateway2AssessmentButton() {
		return cy.getByData('submit-gateway-2');
	}

	get proceduralDocumentsTable() {
		return cy.getByData('procedural-documents-table');
	}

	get consultationDocumentsTable() {
		return cy.getByData('consultation-documents-table');
	}

	get planContentEvidenceBackgroundTable() {
		return cy.getByData('plan-content,-evidence-and-background-table');
	}

	get workshopDetailsTable() {
		return cy.getByData('gateway-2-workshop-section');
	}

	get checkTheGuidanceLink() {
		return cy.get('.govuk-inset-text .govuk-link');
	}

	get readyToSubmitHeading() {
		return cy.contains('h2', readyToSubmitGateway2Heading);
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading(gateway2SubmissionHeading);
	}

	verifySectionText(table: Cypress.Chainable, text: string) {
		table.prev('p.govuk-body').should('be.visible').and('contain.text', text);
	}

	verifyProceduralDocuments() {
		this.verifyDocumentSection(
			this.proceduralDocumentsTable,
			'Procedural Documents',
			gateway2ApplicationDocuments.procedural
		);
		this.verifySectionText(
			this.proceduralDocumentsTable,
			'You should aim to include all these documents in your submission. Your assessor may request them if not submitted. They should be final versions except where drafts are specified.'
		);
	}

	verifyConsultationDocuments() {
		this.verifyDocumentSection(
			this.consultationDocumentsTable,
			'Consultation Documents',
			gateway2ApplicationDocuments.consultation
		);
		this.verifySectionText(
			this.consultationDocumentsTable,
			'You should aim to include all these documents in your submission. Your assessor may request them if not submitted. They should be final versions.'
		);
	}

	verifyCheckTheGuidanceLink() {
		this.checkTheGuidanceLink
			.should('be.visible')
			.and('contain.text', 'check the guidance')
			.and('have.attr', 'href', `/guidance`);
	}

	verifyPlanContentEvidenceBackgroundDocuments() {
		this.verifyDocumentSection(
			this.planContentEvidenceBackgroundTable,
			'Plan content, evidence and background',
			gateway2ApplicationDocuments.PlanContentEvidenceBackground
		);
		this.verifySectionText(
			this.planContentEvidenceBackgroundTable,
			'You should include any available documents that will form part of your local plan and show progress towards completion. You can also include a link to any digital materials that are published publicly online. You should also include your latest policies map. These can all be in draft form.'
		);
	}

	// Cross-service tests start in Manage, so these Portal assertions need to run inside cy.origin().
	openForCrossServiceAndVerify(planReference: string, planTitle: string) {
		const path = this.pathFor(planReference);

		cy.origin(
			Cypress.env('portalBaseUrl'),
			{
				args: { path, planTitle, gateway2SubmissionRows, gateway2SubmissionHeading, notAddedStatus, submitButtonText }
			},
			({ path, planTitle, gateway2SubmissionRows, gateway2SubmissionHeading, notAddedStatus, submitButtonText }) => {
				cy.visit(path);
				cy.location('pathname').should('eq', path);
				cy.contains('h1', gateway2SubmissionHeading).should('be.visible').and('contain.text', planTitle);

				gateway2SubmissionRows.forEach((row) => {
					cy.contains('tr', row).should('be.visible').and('contain.text', notAddedStatus);
				});

				cy.get('[data-cy="submit-gateway-2"]').should('be.visible').and('contain.text', submitButtonText);
			}
		);
	}

	verifySaveAndComeBackLink(href: string) {
		this.saveAndComeBackLink
			.should('be.visible')
			.and('contain.text', 'Save and come back later')
			.and('have.attr', 'href', href);
	}

	verifySubmitGateway2AssessmentButton() {
		this.submitGateway2AssessmentButton
			.should('be.visible')
			.and('contain.text', 'Submit')
			.and('have.attr', 'type', 'submit');
		this.readyToSubmitHeading
			.should('be.visible')
			.next('p.govuk-body')
			.should('contain.text', 'You cannot make any changes after submission.');
	}

	verifySubmissionData(todayDisplay: string, submitterEmail: string) {
		cy.getByData('submission-copy')
			.should('be.visible')
			.invoke('text')
			.should('match', /^Your application was submitted on .+ at \d{2}:\d{2} by .+$/)
			.and('include', todayDisplay)
			.and('include', submitterEmail);
	}

	verifySubmittedApplication(submittedDate: string, submitterEmail: string) {
		this.verifyLoaded();
		this.verifySubmissionData(submittedDate, submitterEmail);
		this.verifyDocumentRowContains(
			this.proceduralDocumentsTable,
			'Gateway 2 cover letter',
			gateway2SubmittedPlan.coveringLetter
		);
		this.verifyDocumentRowContains(
			this.proceduralDocumentsTable,
			'Local plan timetable',
			...gateway2SubmittedPlan.timetableFiles
		);
		this.verifyNoAddOrChangeLinks();
		this.verifySubmitGateway2ButtonNotShown();
	}

	verifyNoAddOrChangeLinks() {
		cy.get('[data-cy^="add-"]').should('not.exist');
		cy.contains('a', 'Change').should('not.exist');
	}

	verifySubmitGateway2ButtonNotShown() {
		this.submitGateway2AssessmentButton.should('not.exist');
	}

	verifyWorkshopData(table: Cypress.Chainable, rows: string[][]) {
		table.within(() => {
			rows.forEach(([key, ...values]) => {
				const row = cy.contains('.govuk-summary-list__row', key);
				row.should('be.visible');
				values.forEach((value) => row.should('contain.text', value));
			});
		});
	}
}

export const gateway2ApplicationPage = new Gateway2ApplicationPage();
