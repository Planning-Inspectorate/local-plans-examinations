import { authenticateManageIfRequired, skipUnlessRealEnvironmentAuth } from '../../../../flows/auth-flow.ts';
import { assignedToMePage } from '../../../../page-objects/manage/assigned-to-me-page.ts';
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
		skipUnlessRealEnvironmentAuth(this);
	});

	it('shows a case assigned to the authorised user', { tags: ['smoke', 'environment-smoke'] }, () => {
		cy.task('seedAssignedToMeCase').then((result) => {
			const { assignedCase, unassignedCase } = result as AssignedToMeSeedResult;

			authenticateManageIfRequired();
			manageHomePage.visit();
			manageHomePage.openAssignedToMe();

			assignedToMePage.verifyLoaded();
			assignedToMePage.verifyCreateCaseLink();
			assignedToMePage.verifyTableHeadings();
			assignedToMePage.verifyAssignedCaseForCurrentUser(assignedCase.reference, assignedCase.planTitle);
			assignedToMePage.verifyCaseNotVisible(unassignedCase.reference);
		});
	});
});
