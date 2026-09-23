import { PortalPlanBasePage } from '../base/portal-plan-page.ts';

const gateway2SubmissionRows = ['Gateway 2 covering letter', 'Local plan timetable', 'Project initiation document'];
const gateway2SubmissionHeading = 'Gateway 2 submission';
const notAddedStatus = 'Not added';
const submitButtonText = 'Submit for Gateway 2 assessment';

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

	get additionalDocumentsTable() {
		return cy.getByData('additional-documents-table');
	}

	get workshopPreferencesTable() {
		return cy.getByData('workshop-preferences-table');
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading(gateway2SubmissionHeading);
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
			.and('contain.text', 'Submit for Gateway 2 assessment')
			.and('have.attr', 'type', 'submit');
	}

	verifySubmissionData(todayDisplay: string, submitterEmail: string) {
		cy.getByData('submission-copy')
			.should('be.visible')
			.invoke('text')
			.should('match', /^Your application was submitted on .+ at \d{2}:\d{2} by .+$/)
			.and('include', todayDisplay)
			.and('include', submitterEmail);
	}

	verifyNoAddOrChangeLinks() {
		cy.get('[data-cy^="add-"]').should('not.exist');
		cy.contains('a', 'Change').should('not.exist');
	}

	verifySubmitGateway2ButtonNotShown() {
		this.submitGateway2AssessmentButton.should('not.exist');
	}
}

export const gateway2ApplicationPage = new Gateway2ApplicationPage();
