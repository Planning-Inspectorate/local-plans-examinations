import type { ManageHomePage } from '../../page-objects/manage/home-page.ts';
import type { AssignedToMePage } from '../../page-objects/manage/assigned-to-me-page.ts';

const caseLinks = () => cy.getByData('case-reference-link');

const firstCaseReference = () =>
	caseLinks()
		.first()
		.invoke('text')
		.then((text) => text.trim());

export const verifyPagination = (page: ManageHomePage | AssignedToMePage) => {
	caseLinks().should('have.length', 30);
	page.verifyNoPreviousPageLink();

	firstCaseReference().then((pageOneReference) => {
		page.openNextPage();
		page.verifyCurrentPage(2);
		caseLinks().should('have.length.greaterThan', 0);
		page.casesTable.should('not.contain.text', pageOneReference);

		page.openPreviousPage();
		page.verifyCurrentPage(1);
		firstCaseReference().should('eq', pageOneReference);
	});
};
