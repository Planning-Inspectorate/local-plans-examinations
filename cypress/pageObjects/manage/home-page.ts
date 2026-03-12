export class ManageHomePage {
	mainHeading = '[[data-cy="main-heading"]';

	verifyMainHeading(text: string) {
		cy.get(this.mainHeading).contains(text);
	}
}
