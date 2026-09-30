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

	it('Shows Optional Documents', { tags: ['regression'] }, () => {
		gateway3ApplicationPage.verifySubHeading('Optional Documents');
		gateway3ApplicationPage.verifyMainContains('Add the documents that are relevant to your plan.');
		gateway3ApplicationPage.verifyDocTableRows(gateway3ApplicationPage.optionalDocumentsTable, [
			{ document: 'Copies of representations', status: 'Not added', addCy: 'add-copies-of-representations' },
			{
				document: 'Supplementary plans statement',
				status: 'Not added',
				addCy: 'add-supplementary-plans-statement'
			},
			{
				document: 'Environmental report',
				status: 'Not added',
				addCy: 'add-environmental-report'
			},
			{
				document:
					'Statement of reasons for a determination that the proposed local plan is unlikely to have significant environmental effects',
				status: 'Not added',
				addCy: 'add-statement-of-reasons-determination'
			},
			{
				document:
					'Summary of representations relating to progress towards meeting prescribed requirements and the LPA response',
				status: 'Not added',
				addCy: 'add-representations-progress-summary'
			},
			{
				document: 'Summary of how Gateway 2 assessor issues have been addressed',
				status: 'Not added',
				addCy: 'add-summary-of-how-gateway-2-assessor-issues-have-been-addressed'
			},
			{
				document:
					'Statement explaining changes since the proposed local plan consultation, reasons for those changes, and any additional consultation',
				status: 'Not added',
				addCy: 'add-changes-since-consultation-statement'
			},
			{
				document: 'Other documents',
				status: 'Not added',
				addCy: 'add-other-documents'
			}
		]);
		gateway3ApplicationPage.verifyTableRowsInOrder(gateway3ApplicationPage.optionalDocumentsTable, [
			'Copies of representations',
			'Supplementary plans statement',
			'Environmental report',
			'Statement of reasons for a determination that the proposed local plan is unlikely to have significant environmental effects',
			'Summary of representations relating to progress towards meeting prescribed requirements and the LPA response',
			'Summary of how Gateway 2 assessor issues have been addressed',
			'Statement explaining changes since the proposed local plan consultation, reasons for those changes, and any additional consultation',
			'Other documents'
		]);
	});

	it('Shows ready to submit for Gateway 3 section', { tags: ['regression'] }, () => {
		gateway3ApplicationPage.verifySubHeading('Ready to submit for Gateway 3');
		gateway3ApplicationPage.verifyMainContains(
			`Once submitted, Gateway 3 will be locked and you cannot make further changes. By submitting, you're confirming that the information you're sharing is correct to the best of your knowledge.`
		);
		gateway3ApplicationPage.verifySubmitGateway3Button();
	});
});
