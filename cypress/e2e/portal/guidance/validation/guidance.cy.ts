import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { myPlansPage } from '../../../../page-objects/portal/my-plans-page.ts';
import { portalGuidancePage } from '../../../../page-objects/portal/guidance-page.ts';

describe('Guidance page validation', () => {
	beforeEach(() => {
		portalLogin();
		myPlansPage.verifyLoaded();
		myPlansPage.openServiceNavigationItem('Guidance');
		portalGuidancePage.verifyLoaded();
	});

	it('shows Show and Hide text on each accordion section when toggled', { tags: ['regression'] }, () => {
		portalGuidancePage.verifyAccordionSectionsToggle(['Gateway 2', 'Gateway 3', 'Examination']);
	});

	it('shows all sections when Show all sections is clicked', { tags: ['regression'] }, () => {
		portalGuidancePage.verifyShowAllSections(['Gateway 2', 'Gateway 3', 'Examination']);
	});
});
