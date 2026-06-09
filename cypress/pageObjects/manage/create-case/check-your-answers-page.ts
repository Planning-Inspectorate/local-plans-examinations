import { BasePage } from '../../base-page.ts';
import type { CreateCaseData } from './types.ts';

type SummaryRowExpectation = {
	key: string;
	values: string[];
	changeHref: string;
};

export class CheckYourAnswersPage extends BasePage {
	constructor() {
		super('/create-a-case/check-your-answers');
	}

	get submitCaseButton() {
		return cy.getByData('submit-case');
	}

	get cannotSubmitYetTag() {
		return cy.getByData('cannot-submit-yet');
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

	changeLinkFor(key: string) {
		return this.summaryRowActions(key).find('a').contains('Change');
	}

	openChangeLinkFor(key: string) {
		this.changeLinkFor(key).should('be.visible').click();
	}

	verifyLoaded() {
		this.verifyPath();
		this.verifyHeading('Check your answers');
	}

	expectedSummaryRows(data: CreateCaseData): SummaryRowExpectation[] {
		const lpaArray = Object.values(data.lpa);

		return [
			{
				key: 'Case officer',
				values: [data.caseOfficer.label],
				changeHref: '/create-a-case/case-details/case-officer'
			},
			{
				key: 'Plan title',
				values: [data.planTitle],
				changeHref: '/create-a-case/case-details/plan-title'
			},
			{
				key: 'Plan type',
				values: [data.planType.label],
				changeHref: '/create-a-case/case-details/plan-type'
			},
			{
				key: 'Local Planning Authorities',
				values: lpaArray.map((l) => l.value),
				changeHref: '/create-a-case/case-details/check-lpas'
			},
			{
				key: 'Contact details',
				values: [
					data.contact.firstName,
					data.contact.lastName,
					data.contact.email,
					data.contact.phone,
					data.contact.lpaContact.label
				],
				changeHref: '/create-a-case/contact-details/check-contact-details'
			},
			{
				key: 'Dates',
				values: [
					data.dates.intentionToCommenceDate.display,
					data.dates.gateway1Date.display,
					data.dates.gateway2Date.display,
					data.dates.gateway3Date.display,
					data.dates.submissionDate.display
				],
				changeHref: '/create-a-case/dates/key-stage-dates'
			}
		];
	}

	verifySummaryRow({ key, values, changeHref }: SummaryRowExpectation) {
		values.forEach((value) => {
			this.summaryRowValue(key).should('contain.text', value);
		});

		this.changeLinkFor(key).should('have.attr', 'href', changeHref);
	}

	verifyAnswers(data: CreateCaseData) {
		this.expectedSummaryRows(data).forEach((row) => {
			this.verifySummaryRow(row);
		});
		this.submitCaseButton.should('be.visible');
	}

	verifyChangeLinksNavigateToExpectedPages(data: CreateCaseData) {
		this.expectedSummaryRows(data).forEach(({ key, changeHref }) => {
			this.openChangeLinkFor(key);
			cy.location('pathname').should('eq', changeHref);
			cy.go('back');
			this.verifyLoaded();
		});
		this.submitCaseButton.should('be.visible');
	}

	submitCase() {
		this.submitCaseButton.should('be.visible').click();
	}

	verifyCannotSubmitYet() {
		this.cannotSubmitYetTag.should('be.visible').and('contain.text', 'Cannot submit yet');
	}
}

export const checkYourAnswersPage = new CheckYourAnswersPage();
