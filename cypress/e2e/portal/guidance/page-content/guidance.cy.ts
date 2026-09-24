import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { cleanupPreparedPlanDetails, preparePlanDetails } from '../../../../flows/portal/plan-flow.ts';
import { portalGuidancePage } from '../../../../page-objects/portal/guidance-page.ts';
import { myPlansPage } from '../../../../page-objects/portal/my-plans-page.ts';

describe('Guidance page content', () => {
	beforeEach(() => {
		preparePlanDetails();
		portalLogin();
		myPlansPage.verifyLoaded();
		myPlansPage.openServiceNavigationItem('Guidance');
		portalGuidancePage.verifyLoaded();
	});
	afterEach(cleanupPreparedPlanDetails);

	it(
		'verify page content for the overview of assessment stages section',
		{ tags: ['regression', 'environment-smoke'] },
		() => {
			portalGuidancePage.verifyServiceNavigation('Guidance', 'Sign out');
			portalGuidancePage.verifyTableHeading();
			portalGuidancePage.verifyTableHeaders(portalGuidancePage.assessmentStagesTable, [
				'Stage',
				'Typical durations',
				'Purpose'
			]);
			portalGuidancePage.verifyTableRows(portalGuidancePage.assessmentStagesTable, [
				['Gateway 1', 'Varies', 'Self-assessment of readiness. No assessor involved.'],
				['Gateway 2', '4 to 6 weeks', 'Assessor provides advice on progress and emerging soundness issues.'],
				['Gateway 3', '4 to 6 weeks', 'Formal stop/go check before examination.'],
				['Examination', 'Up to 6 months', 'Independent examination by an Inspector.']
			]);
		}
	);

	it('verify page content for document requirements section', { tags: ['regression'] }, () => {
		portalGuidancePage.verifySubHeading('Document requirements');
		portalGuidancePage.verifyAccordionSections([
			['Gateway 2', 'Placeholder: list documents required at Gateway 2. (Copy will be provided later.)'],
			['Gateway 3', 'Placeholder: list documents required at Gateway 3. (Copy will be provided later.)'],
			['Examination', 'Placeholder: list documents required for Examination. (Copy will be provided later.)']
		]);
	});

	it('verify page content for related content section', { tags: ['regression'] }, () => {
		portalGuidancePage.verifySubHeading('Related content');
		portalGuidancePage.verifyLinkHrefs([
			[
				'Planning Inspectorate procedural guide',
				'https://www.gov.uk/guidance/procedural-guide-for-examinations-and-gateways-under-the-town-and-country-planning-local-planning-england-regulations-2026'
			],
			[
				'Create or update a local plan using the new system',
				'https://www.gov.uk/government/collections/create-or-update-a-local-plan-using-the-new-system'
			],
			[
				'Gateway 2 assessment for local plans: what you need to do',
				'https://www.gov.uk/guidance/gateway-2-assessment-for-local-plans-what-you-need-to-do'
			],
			[
				'Gateway 3 for local plans: what you need to do',
				'https://www.gov.uk/guidance/gateway-3-for-local-plans-what-you-need-to-do'
			]
		]);
	});
});
