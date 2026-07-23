import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { gateway2ApplicationPage } from '../../../../page-objects/portal/gw2-application/gateway-2-application-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 2 application page content', () => {
	beforeEach(() => {
		portalLogin();
		loadPlanDetails().then((plan) => {
			gateway2ApplicationPage.visit(plan.urlReference);
			gateway2ApplicationPage.verifyLoaded();
		});
	});

	it('Shows plan title, page header, inset text and copy text', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway2ApplicationPage.verifyServiceNavigation('Guidance', 'Account settings', 'Manage users');
			gateway2ApplicationPage.verifyBackLink(`/manage-local-plans/${plan.urlReference}`);
			gateway2ApplicationPage.verifyCaption(plan.title);
			gateway2ApplicationPage.verifyHeading('Gateway 2 submission');
			gateway2ApplicationPage.verifyMainContains(
				`Your target submission date is ${plan.dates.gateway2}. A Gateway 2 assessment usually takes about 6 weeks.`,
				'Save and come back later',
				'Add the documents that are relevant to your plan.'
			);
			gateway2ApplicationPage.verifySaveAndComeBackLink(`/manage-local-plans/${plan.urlReference}`);
		});
	});

	it('Shows Procedural Documents', { tags: ['regression'] }, () => {
		gateway2ApplicationPage.verifySubHeading('Procedural Documents');
		gateway2ApplicationPage.verifyTableRows(gateway2ApplicationPage.proceduralDocumentsTable, [
			{ document: 'Gateway 2 cover letter', status: 'Not added', addCy: 'add-gateway-2-cover-letter' },
			{ document: 'Local plan timetable', status: 'Not added', addCy: 'add-local-plan-timetable' },
			{ document: 'Project initiation document', status: 'Not added', addCy: 'add-project-initiation-document' },
			{ document: 'Draft statement of compliance', status: 'Not added', addCy: 'add-draft-statement-of-compliance' },
			{ document: 'Draft statement of soundness', status: 'Not added', addCy: 'add-draft-statement-of-soundness' }
		]);
		gateway2ApplicationPage.verifyTableRowsInOrder(gateway2ApplicationPage.proceduralDocumentsTable, [
			'Gateway 2 cover letter',
			'Local plan timetable',
			'Project initiation document',
			'Draft statement of compliance',
			'Draft statement of soundness'
		]);
	});

	it('Shows Consultation Documents', { tags: ['regression'] }, () => {
		gateway2ApplicationPage.verifySubHeading('Consultation Documents');
		gateway2ApplicationPage.verifyTableRows(gateway2ApplicationPage.consultationDocumentsTable, [
			{
				document: 'Notice of Intention to commence local plan preparation',
				status: 'Not added',
				addCy: 'add-notice-of-intention'
			},
			{ document: 'Scoping consultation documents', status: 'Not added', addCy: 'add-scoping-consultation-documents' },
			{
				document: 'Consultation summary of feedback to scoping consultation',
				status: 'Not added',
				addCy: 'add-consultation-summary-scoping'
			},
			{
				document: 'Gateway 1 - Self Assessment of Readiness',
				status: 'Not added',
				addCy: 'add-gateway-1-self-assessment'
			},
			{
				document: 'Consultation on proposed local plan content and evidence documents',
				status: 'Not added',
				addCy: 'add-consultation-proposed-content'
			},
			{
				document: 'Consultation summary for proposed local plan content and evidence documents',
				status: 'Not added',
				addCy: 'add-consultation-summary-proposed-content'
			}
		]);
		gateway2ApplicationPage.verifyTableRowsInOrder(gateway2ApplicationPage.consultationDocumentsTable, [
			'Notice of Intention to commence local plan preparation',
			'Scoping consultation documents',
			'Consultation summary of feedback to scoping consultation',
			'Gateway 1 - Self Assessment of Readiness',
			'Consultation on proposed local plan content and evidence documents',
			'Consultation summary for proposed local plan content and evidence documents'
		]);
	});

	it('Shows Additional Documents', { tags: ['regression'] }, () => {
		gateway2ApplicationPage.verifySubHeading('Additional documents');
		gateway2ApplicationPage.verifyTableRows(gateway2ApplicationPage.additionalDocumentsTable, [
			{ document: 'Subsequent work towards a draft Plan', status: 'Not added', addCy: 'add-subsequent-work' }
		]);
	});

	it('Shows Workshop preferences', { tags: ['regression'] }, () => {
		gateway2ApplicationPage.verifySubHeading('Workshop preferences');
		gateway2ApplicationPage.verifyTableRows(gateway2ApplicationPage.workshopPreferencesTable, [
			{ document: 'Suggested workshop venue', status: 'Not added', addCy: 'add-workshop-venue' },
			{ document: 'Suggested workshop dates', status: 'Not added', addCy: 'add-workshop-dates' }
		]);
		gateway2ApplicationPage.verifyTableRowsInOrder(gateway2ApplicationPage.workshopPreferencesTable, [
			'Suggested workshop venue',
			'Suggested workshop dates'
		]);
	});

	it('Shows Submit for Gateway 2 assessment', { tags: ['regression'] }, () => {
		gateway2ApplicationPage.verifySubmitGateway2AssessmentButton();
	});
});
