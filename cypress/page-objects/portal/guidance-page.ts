import { BasePage } from '../base-page.ts';

export class PortalGuidancePage extends BasePage {
	constructor() {
		super('/guidance');
	}

	get assessmentStagesTable() {
		return cy.get('.govuk-table');
	}

	get assessmentStagesTableHeading() {
		return cy.get('.govuk-table__caption--m');
	}

	verifyAccordionSections(sections: string[][]) {
		sections.forEach(([heading, content]) => {
			this.accordionSection(heading).within(() => {
				cy.get('.govuk-accordion__section-button').click();
				cy.get('.govuk-accordion__section-content').should('contain.text', content).and('be.visible');
			});
		});
	}

	verifyTableHeading() {
		this.assessmentStagesTableHeading.should('contain.text', 'Overview of assessment stages');
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading('Guidance');
		cy.get('h1').should('have.length', 1);
	}

	verifyLinkHrefs(links: [string, string][]) {
		links.forEach(([text, href]) => {
			cy.contains('a', text).should('be.visible').and('have.attr', 'href', href);
		});
	}

	accordionSection(heading: string) {
		return cy.contains('.govuk-accordion__section', heading);
	}

	verifyAccordionSectionsToggle(headings: string[]) {
		headings.forEach((heading) => {
			this.accordionSection(heading).within(() => {
				cy.get('.govuk-accordion__section-toggle-text').should('have.text', 'Show');
				cy.get('.govuk-accordion__section-button').click();
				cy.get('.govuk-accordion__section-toggle-text').should('have.text', 'Hide');
			});
		});
	}

	get showAllSectionsButton() {
		return cy.get('.govuk-accordion__show-all');
	}

	verifyShowAllSections(headings: string[]) {
		this.showAllSectionsButton.find('.govuk-accordion__show-all-text').should('have.text', 'Show all sections');
		this.showAllSectionsButton.click();
		this.showAllSectionsButton.find('.govuk-accordion__show-all-text').should('have.text', 'Hide all sections');

		headings.forEach((heading) => {
			this.accordionSection(heading).find('.govuk-accordion__section-toggle-text').should('have.text', 'Hide');
		});
	}
}

export const portalGuidancePage = new PortalGuidancePage();
