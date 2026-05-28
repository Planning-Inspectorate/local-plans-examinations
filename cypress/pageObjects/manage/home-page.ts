export class ManageHomePage {
	mainHeading = '.govuk-heading-xl';

	verifyMainHeading(text: string) {
		cy.get(this.mainHeading).contains(text);
	}
}
