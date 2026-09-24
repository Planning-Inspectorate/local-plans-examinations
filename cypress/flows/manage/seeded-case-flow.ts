import { seededCase } from '../../fixtures/manage/case.ts';
import { caseOverviewPage } from '../../page-objects/manage/case-overview/index.ts';
import { manageHomePage } from '../../page-objects/manage/home-page.ts';
import { authenticateManageIfRequired, isEnvironmentSmoke } from '../auth-flow.ts';

type SeededManageCase = {
	planTitle: string;
	reference: string;
};

const smokeCaseReferenceKey = 'manageSmokeCaseReference';

export const openSeededManageCase = () => {
	authenticateManageIfRequired();

	return cy.task<SeededManageCase>('seedDb').then((result) => {
		if (isEnvironmentSmoke()) {
			Cypress.env(smokeCaseReferenceKey, result.reference);
		}

		manageHomePage.visit();
		manageHomePage.openCaseByReference(result.reference);
		caseOverviewPage.verifyLoaded(result.planTitle || seededCase.planTitle);

		return cy.wrap(result, { log: false });
	});
};

export const cleanupSeededManageCase = () => {
	if (!isEnvironmentSmoke()) {
		return;
	}

	const reference = Cypress.env(smokeCaseReferenceKey);
	if (reference) {
		cy.task('softDeleteCaseByReference', reference);
		Cypress.env(smokeCaseReferenceKey, null);
	}
};
