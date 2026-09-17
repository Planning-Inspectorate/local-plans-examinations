import { authenticateManageIfRequired, skipUnlessEnvironmentSmoke } from '../../../../flows/auth-flow.ts';
import { assignedToMePage } from '../../../../page-objects/manage/assigned-to-me-page.ts';
import { caseOverviewPage } from '../../../../page-objects/manage/case-overview/index.ts';
import { manageHomePage } from '../../../../page-objects/manage/home-page.ts';

type AssignedToMeSeedResult = {
	assignedCase: {
		planTitle: string;
		reference: string;
	};
	unassignedCase: {
		planTitle: string;
		reference: string;
	};
};

describe('Assigned to me', () => {
	before(function () {
		skipUnlessEnvironmentSmoke(this);
	});

	it('shows a case assigned to the authorised user', { tags: ['environment-smoke'] }, () => {
		cy.task('seedAssignedToMeCase').then((result) => {
			const { assignedCase, unassignedCase } = result as AssignedToMeSeedResult;

			authenticateManageIfRequired();
			manageHomePage.visit();
			manageHomePage.openAssignedToMe();

			assignedToMePage.verifyLoaded();
			assignedToMePage.verifyCaseVisible(assignedCase.reference);
			assignedToMePage.verifyCaseNotVisible(unassignedCase.reference);
			assignedToMePage.openCase(assignedCase.reference);

			caseOverviewPage.verifyLoaded(assignedCase.planTitle);
		});
	});
});
