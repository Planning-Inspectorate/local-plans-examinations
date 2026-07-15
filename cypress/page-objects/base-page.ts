import type { DateAnswer } from '../types/date.ts';

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

	verifySearch(search: string) {
		cy.location('search').should('eq', search);
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

	get bodyText() {
		return cy.get('.govuk-body');
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

	dateInput(fieldName: string, part: keyof DateAnswer) {
		return cy.get(`[name="${fieldName}-${part}"], [name="${fieldName}_${part}"]`);
	}

	verifyDateInputsVisible(fieldName: string) {
		this.dateInput(fieldName, 'day').should('be.visible');
		this.dateInput(fieldName, 'month').should('be.visible');
		this.dateInput(fieldName, 'year').should('be.visible');
	}

	verifyDateInputValues(fieldName: string, date: DateAnswer) {
		this.dateInput(fieldName, 'day').should('have.value', date.day);
		this.dateInput(fieldName, 'month').should('have.value', date.month);
		this.dateInput(fieldName, 'year').should('have.value', date.year);
	}

	enterDateAnswer(fieldName: string, date: DateAnswer) {
		this.dateInput(fieldName, 'day').clearAndWrite(date.day);
		this.dateInput(fieldName, 'month').clearAndWrite(date.month);
		this.dateInput(fieldName, 'year').clearAndWrite(date.year);
	}

	clearDateInputs(fieldName: string) {
		this.dateInput(fieldName, 'day').clear();
		this.dateInput(fieldName, 'month').clear();
		this.dateInput(fieldName, 'year').clear();
	}

	verifySummaryRowContains(key: string, ...values: string[]) {
		values.forEach((value) => {
			this.summaryRowValue(key).should('contain.text', value);
		});
	}

	verifySummaryRowActionHref(key: string, href: string | RegExp, link = this.summaryRowActionLink(key)) {
		const assertion = typeof href === 'string' ? 'eq' : 'match';

		link.should('be.visible').should('have.attr', 'href').and(assertion, href);
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

	verifyBackLink(href?: string | RegExp) {
		const backLink = this.backLink.should('be.visible');

		if (href) {
			const assertion = typeof href === 'string' ? 'eq' : 'match';

			backLink.should('have.attr', 'href').and(assertion, href);
		}
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

	get errorSummaryList() {
		return cy.get('.govuk-error-summary__list');
	}

	verifyErrorSummary(title: string, linkText: string) {
		this.errorSummary.should('be.visible').and('contain.text', title);
		this.errorSummaryList.should('contain.text', linkText);
	}
	verifyServiceNavigation(...links: string[]) {
		links.forEach((link) => {
			cy.contains('a', link).should('be.visible');
		});
	}
}
