export class PortalHomePage {
	heading = '.govuk-heading-l';
	dbConnectionMessage = '[data-cy="db-connection"]';

	verifyHeading(text: string) {
		cy.get(this.heading).contains(text);
	}

	verifyDbConnection(text: string) {
		cy.get(this.dbConnectionMessage).contains(text);
	}
}
