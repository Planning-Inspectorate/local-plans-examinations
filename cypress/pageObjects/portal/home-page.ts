export class PortalHomePage {
	heading = '.govuk-heading-l';
	dbConnectionMessage = '[class="govuk-body"]';

	verifyHeading(text: string) {
		cy.get(this.heading).contains(text);
	}

	verifyDbConnection(text: string) {
		cy.get(this.dbConnectionMessage).first().contains(text);
	}
}
