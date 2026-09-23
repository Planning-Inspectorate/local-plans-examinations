import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { gateway3ApplicationPage } from '../../../../page-objects/portal/gw3-application/gateway-3-application-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 3 application page content', () => {
	beforeEach(() => {
		portalLogin();
		loadPlanDetails().then((plan) => {
			gateway3ApplicationPage.visit(plan.urlReference);
			gateway3ApplicationPage.verifyLoaded();
		});
	});

	it('Shows plan title, page header, inset text and copy text', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3ApplicationPage.verifyServiceNavigation('Guidance', 'Sign out');
			gateway3ApplicationPage.verifyBackLink(`/manage-local-plans/${plan.urlReference}`);
			gateway3ApplicationPage.verifyCaption(plan.title);
			gateway3ApplicationPage.verifyHeading('Gateway 3 submission');
			gateway3ApplicationPage.verifyMainContains(
				'Gateway 3 is a more formal step in the development of your local plan. At this point some documents are mandatory to submit.',
				`You have provided the expected submission date of ${plan.dates.gateway3}. The assessment usually takes between 4 and 6 weeks from submission.`,
				'Save and come back later'
			);
			gateway3ApplicationPage.verifySaveAndComeBackLink(`/manage-local-plans/${plan.urlReference}`);
		});
	});

	it('Shows Required Information', { tags: ['regression'] }, () => {
		gateway3ApplicationPage.verifySubHeading('Required Information');
		gateway3ApplicationPage.verifyMainContains('You must add these documents before you can submit.');
		gateway3ApplicationPage.verifyDocTableRows(gateway3ApplicationPage.requiredInformationTable, [
			{ document: 'Examination website', status: 'Not added', addCy: 'add-examination-website' },
			{
				document: 'Proposed local plan intended for submission for examination',
				status: 'Not added',
				addCy: 'add-proposed-local-plan-intended-for-submission-for-examination'
			},
			{
				document: 'Map of proposed local plan policies',
				status: 'Not added',
				addCy: 'add-map-of-proposed-local-plan-policies'
			},
			{ document: 'Statement of Compliance', status: 'Not added', addCy: 'add-statement-of-compliance' },
			{ document: 'Statement of Soundness', status: 'Not added', addCy: 'add-statement-of-soundness' },
			{
				document: 'Summary of consultation and engagement activities undertaken in preparing the proposed local plan',
				status: 'Not added',
				addCy: 'add-summary-of-consultation-and-engagement-activities-undertaken-in-preparing-the-proposed-local-plan'
			},
			{
				document: 'Summary of scoping consultation',
				status: 'Not added',
				addCy: 'add-summary-of-scoping-consultation'
			},
			{
				document: 'Summary of consultation on proposed local plan content and evidence',
				status: 'Not added',
				addCy: 'add-summary-of-consultation-on-proposed-local-plan-content-and-evidence'
			},
			{
				document: 'Summary of consultation on proposed local plan',
				status: 'Not added',
				addCy: 'add-summary-of-consultation-on-proposed-local-plan'
			},
			{
				document: 'Statement setting out practical arrangements demonstrating readiness for examination',
				status: 'Not added',
				addCy: 'add-statement-setting-out-practical-arrangements-demonstrating-readiness-for-examination'
			}
		]);
		gateway3ApplicationPage.verifyTableRowsInOrder(gateway3ApplicationPage.requiredInformationTable, [
			'Examination website',
			'Proposed local plan intended for submission for examination',
			'Map of proposed local plan policies',
			'Statement of Compliance',
			'Statement of Soundness',
			'Summary of consultation and engagement activities undertaken in preparing the proposed local plan',
			'Summary of scoping consultation',
			'Summary of consultation on proposed local plan content and evidence',
			'Summary of consultation on proposed local plan',
			'Statement setting out practical arrangements demonstrating readiness for examination'
		]);
	});
});
