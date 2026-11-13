import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { cleanupPreparedPlanDetails, preparePlanDetails } from '../../../../flows/portal/plan-flow.ts';
import { portalGuidancePage } from '../../../../page-objects/portal/guidance-page.ts';
import { myPlansPage } from '../../../../page-objects/portal/my-plans-page.ts';
import { guidanceSections } from '../../../../fixtures/portal/guidance.ts';

describe('Guidance page content', () => {
	beforeEach(() => {
		preparePlanDetails();
		portalLogin();
		myPlansPage.verifyLoaded();
		myPlansPage.openServiceNavigationItem('Guidance');
		portalGuidancePage.verifyLoaded();
	});
	afterEach(cleanupPreparedPlanDetails);

	it.skip(
		'Verify page content for sections on the guidance page',
		{ tags: ['regression', 'environment-smoke'] },
		() => {
			portalGuidancePage.verifyServiceNavigation('Guidance', 'Sign out');
			portalGuidancePage.verifyGuidanceDescription();
			guidanceSections.forEach((section) => portalGuidancePage.verifyGuidanceSection(section));
		}
	);
});
