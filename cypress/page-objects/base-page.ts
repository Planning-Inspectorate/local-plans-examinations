export class BasePage {
	private readonly path?: string | RegExp;

	constructor(path?: string | RegExp) {
		this.path = path;
	}

	visit(path = this.path) {
		if (!path) {
			throw new Error(`${this.constructor.name} does not define a path`);
		}

		if (path instanceof RegExp) {
			throw new Error(`${this.constructor.name} cannot visit a RegExp path`);
		}

		cy.visit(path);
	}

	verifyPath(path = this.path) {
		if (!path) {
			throw new Error(`${this.constructor.name} does not define a path`);
		}

		if (path instanceof RegExp) {
			cy.location('pathname').should('match', path);
			return;
		}

		cy.location('pathname').should('eq', path);
	}

	verifyPathMatches(pathPattern: RegExp) {
		cy.location('pathname').should('match', pathPattern);
	}

	verifyLoaded() {
		this.verifyPath();
	}

	get pageHeading() {
		return cy.get('h1').first();
	}

	get mainContent() {
		return cy.get('main');
	}

	get saveAndContinueButton() {
		return cy.getByData('button-save-and-continue');
	}

	get backLink() {
		return cy.getByData('back-link');
	}

	get addListItemButton() {
		return cy.getByData('add-list-item');
	}

	get manageListSummary() {
		return cy.getByData('manage-list-summary');
	}

	summaryRow(key: string) {
		return cy.contains('.govuk-summary-list__key', key).parent('.govuk-summary-list__row');
	}

	summaryRowValue(key: string) {
		return this.summaryRow(key).find('.govuk-summary-list__value');
	}

	summaryRowActions(key: string) {
		return this.summaryRow(key).find('.govuk-summary-list__actions');
	}

	summaryRowActionLink(key: string) {
		return this.summaryRowActions(key).find('a');
	}

	listItemRemoveLink(index = 1) {
		return cy.getByData(`remove-list-item-${index}`);
	}

	listItemChangeLink(index = 1) {
		return cy.getByData(`change-list-item-${index}`);
	}

	get errorSummary() {
		return cy.get('.govuk-error-summary');
	}

	get fieldErrors() {
		return cy.get('.govuk-error-message');
	}

	verifyHeading(text: string) {
		this.pageHeading.should('be.visible').and('contain.text', text);
	}

	verifyMainContains(...expectedText: string[]) {
		const mainContent = this.mainContent.should('be.visible');

		expectedText.forEach((text) => {
			mainContent.should('contain.text', text);
		});
	}

	saveAndContinue() {
		this.saveAndContinueButton.should('be.visible').click();
	}

	goBack() {
		this.backLink.should('be.visible').click();
	}

	addListItem() {
		this.addListItemButton.should('be.visible').click();
	}

	removeListItem(index = 1) {
		this.listItemRemoveLink(index).should('be.visible').click();
	}

	changeListItem(index = 1) {
		this.listItemChangeLink(index).should('be.visible').click();
	}

	verifySaveAndContinueVisible() {
		this.saveAndContinueButton.should('be.visible');
	}

	verifySummaryContains(...expectedText: string[]) {
		const manageListSummary = this.manageListSummary.should('be.visible');

		expectedText.forEach((text) => {
			manageListSummary.should('contain.text', text);
		});
	}

	verifySummaryDoesNotContain(...expectedText: string[]) {
		const manageListSummary = this.manageListSummary.should('be.visible');

		expectedText.forEach((text) => {
			manageListSummary.should('not.contain.text', text);
		});
	}

	verifyRemoveListItemHidden(index = 1) {
		this.listItemRemoveLink(index).should('not.exist');
	}

	verifyErrorSummaryContains(message: string) {
		this.errorSummary.should('be.visible').and('contain.text', message);
	}

	verifyFieldErrorContains(message: string) {
		this.fieldErrors.should('be.visible').and('contain.text', message);
	}

	verifyValidationError(message: string) {
		this.verifyErrorSummaryContains(message);
		this.verifyFieldErrorContains(message);
	}

	verifyValidationErrors(...messages: string[]) {
		messages.forEach((message) => {
			this.verifyValidationError(message);
		});
	}

	verifyErrorTitle() {
		cy.title().should('contain', 'Error:');
	}

	submitAndVerifyValidationErrors(...messages: string[]) {
		this.saveAndContinue();
		this.verifyValidationErrors(...messages);
		this.verifyErrorTitle();
	}

	visitAndSubmitForValidation(...messages: string[]) {
		this.visit();
		this.verifyLoaded();
		this.submitAndVerifyValidationErrors(...messages);
	}
}
