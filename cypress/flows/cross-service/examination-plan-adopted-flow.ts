import type { DateAnswer } from '../../types/date.ts';

export const enterAdoptionDateInManage = (reference: string, date: DateAnswer, displayDate: string) => {
	cy.origin(
		Cypress.env('manageBaseUrl'),
		{ args: { reference, date, displayDate } },
		({ reference, date, displayDate }) => {
			cy.visit(`/case/${encodeURIComponent(reference)}/examination`);

			cy.get('a[href*="/outcome/adoption-date"]').should('be.visible').click();
			cy.location('pathname').should('match', /\/examination\/outcome\/adoption-date$/);
			cy.contains('When was the plan adopted?').should('be.visible');

			(['day', 'month', 'year'] as const).forEach((part) => {
				cy.get(`[name="adoptionDate-${part}"], [name="adoptionDate_${part}"]`)
					.should('be.visible')
					.clear()
					.type(date[part])
					.should('have.value', date[part]);
			});

			cy.get('[data-cy="button-save-and-continue"]').should('be.enabled').click();

			cy.location('pathname').should('not.contain', 'adoption-date');
			cy.get('.govuk-error-summary').should('not.exist');
			cy.contains('.govuk-summary-list__key', 'Adoption date')
				.parent('.govuk-summary-list__row')
				.should('contain.text', displayDate);
		}
	);
};
