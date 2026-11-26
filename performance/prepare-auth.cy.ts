import { authenticateManageIfRequired } from '../cypress/flows/auth-flow.ts';
import { manageHomePage } from '../cypress/page-objects/manage/home-page.ts';
import { caseOverviewPlanTitlePage } from '../cypress/page-objects/manage/case-overview/plan-title-page.ts';

describe('Prepare independent Manage performance sessions', () => {
	const references: string[] = Cypress.env('manageReferences');
	references.forEach((reference, index) => {
		it(`authenticates worker ${index + 1}`, () => {
			cy.then(() => Cypress.session.clearAllSavedSessions());
			authenticateManageIfRequired();
			manageHomePage.visit();
			manageHomePage.verifyLoaded();
			manageHomePage.verifyHeading('All cases');
			caseOverviewPlanTitlePage.visit(`/case/${reference}/overview/case-details/plan-title`);
			caseOverviewPlanTitlePage.verifyLoaded();
			cy.getCookies({ log: false }).then((cookies) => {
				cy.task('savePerformanceCookies', { index, cookies }, { log: false });
			});
		});
	});
});
