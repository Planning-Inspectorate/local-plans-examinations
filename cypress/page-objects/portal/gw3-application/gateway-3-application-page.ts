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

	get requiredInformationTable() {
		return cy.getByData('required-information-section');
	}

	get optionalDocumentsTable() {
		return cy.getByData('optional-documents-section');
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

	verifyRequiredInformation() {
		this.verifyDocumentSection(
			this.requiredInformationTable,
			'Required Information',
			gateway3ApplicationDocuments.required
		);
		this.verifyMainContains('You must add these documents before you can submit.');
	}

	verifyOptionalDocuments() {
		this.verifyDocumentSection(
			this.optionalDocumentsTable,
			'Optional Documents',
			gateway3ApplicationDocuments.optional
		);
		this.verifyMainContains('Add the documents that are relevant to your plan.');
	}

	verifySaveAndComeBackLink(href: string) {
		this.saveAndComeBackLink
			.should('be.visible')
			.and('contain.text', 'Save and come back later')
			.and('have.attr', 'href', href);
	}

	verifySubmitGateway3Button() {
		this.submitGateway3Button.should('be.visible').and('contain.text', 'Submit').and('have.attr', 'type', 'submit');
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
