import { seededCase } from '../../fixtures/manage/case.ts';
import { caseOverviewPage } from '../../page-objects/manage/case-overview/index.ts';
import { manageHomePage } from '../../page-objects/manage/home-page.ts';
import { authenticateManageIfRequired, isEnvironmentSmoke } from '../auth-flow.ts';

export type SeededManageCase = {
	planTitle: string;
	reference: string;
};

const smokeCaseReferenceKey = 'manageSmokeCaseReference';

export const openManageCase = (seededManageCase: SeededManageCase) => {
	authenticateManageIfRequired();
	manageHomePage.visit();
	manageHomePage.openCaseByReference(seededManageCase.reference);
	caseOverviewPage.verifyLoaded(seededManageCase.planTitle || seededCase.planTitle);

	return cy.wrap(seededManageCase, { log: false });
};

export const openSeededManageCase = () => {
	return cy.task<SeededManageCase>('seedDb').then((result) => {
		if (isEnvironmentSmoke()) {
			Cypress.env(smokeCaseReferenceKey, result.reference);
		}

		return openManageCase(result);
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
