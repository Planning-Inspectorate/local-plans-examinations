import { portalLogin, THIRD_TEST_EMAIL, FIFTH_TEST_EMAIL } from '../../../../flows/portal/login-flow.ts';
import { submitGateway2Application } from '../../../../flows/portal/gateway-2-submission-flow.ts';
import { gateway2ApplicationPage } from '../../../../page-objects/portal/gw2-application/gateway-2-application-page.ts';
import {
	localPlanTimetablePage,
	gateway2CoverLetterPage
} from '../../../../page-objects/portal/gw2-application/gateway-2-uploads.page.ts';
import type { PlanDetailsFixture, Gateway2ReportIssuedFixture } from '../../../../fixtures/portal/types.ts';
import { openGateway2ApplicationPage } from '../../../../flows/portal/plan-flow.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');
const loadReportIssuedPlan = () => cy.fixture<Gateway2ReportIssuedFixture>('portal/gateway-2-report-issued.json');
const today = new Date();
const todayDisplay = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

describe('Gateway 2 application page content after submission', () => {
	beforeEach(() => {
		portalLogin();
	});

	after(() => cy.task('clearDb'));

	it('Shows the Gateway 2 submission data has been recorded correctly', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			submitGateway2Application(plan, [
				{ page: gateway2CoverLetterPage, fileNames: ['test-document.pdf'] },
				{ page: localPlanTimetablePage, fileNames: ['test-document.docx', 'test-document.xlsx'] }
			]);

			gateway2ApplicationPage.visit(plan.urlReference);
			gateway2ApplicationPage.verifyLoaded();

			gateway2ApplicationPage.verifySubmissionData(todayDisplay, 'test@planninginspectorate.gov.uk');

			gateway2ApplicationPage.verifyDocumentRowContains(
				gateway2ApplicationPage.proceduralDocumentsTable,
				'Gateway 2 covering letter',
				'test-document.pdf'
			);

			gateway2ApplicationPage.verifyDocumentRowContains(
				gateway2ApplicationPage.proceduralDocumentsTable,
				'Local plan timetable',
				'test-document.docx',
				'test-document.xlsx'
			);

			gateway2ApplicationPage.verifyNoAddOrChangeLinks();
			gateway2ApplicationPage.verifySubmitGateway2ButtonNotShown();
		});
	});
});

describe('Gateway 2 application page content after submission and GW2 report issued', () => {
	beforeEach(() => {
		portalLogin(THIRD_TEST_EMAIL);
	});

	after(() => cy.task('clearDb'));

	it('Shows the issued Gateway 2 report with the date it was shared', { tags: ['regression'] }, () => {
		loadReportIssuedPlan().then((plan) => {
			openGateway2ApplicationPage(plan);

			gateway2ApplicationPage.verifySubmissionData(plan.submittedDate, THIRD_TEST_EMAIL);
			gateway2ApplicationPage.verifySummaryRowContains(
				'Gateway 2 report',
				plan.report.fileName,
				`(shared on ${plan.report.sharedDate})`
			);
			gateway2ApplicationPage.verifySummaryRowValueLinkHref(
				'Gateway 2 report',
				/\/gateway-2-submission\/download-document\/.+/
			);
		});
	});
});

describe('Gateway 2 application page content after workshop fields filled in BO', () => {
	beforeEach(() => {
		portalLogin(FIFTH_TEST_EMAIL);
	});

	after(() => cy.task('clearDb'));

	it('Shows all the workshop data that was entered in the BO and the updated ', { tags: ['regression'] }, () => {
		const dateShared = new Date().toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			timeZone: 'GMT'
		});
		openGateway2ApplicationPage('PLAN-D01');
		gateway2ApplicationPage.verifyWorkshopData(gateway2ApplicationPage.workshopDetailsTable, [
			['Workshop venue', 'Conference Hall, 12 Milton Lane, Westside, London, WW1 2RT'],
			['Workshop date and time', '8 March 2027 at 11:44 to 15:45'],
			['Workshop documents', 'test-document.docx', 'test-document.pdf', `(shared on ${dateShared}`]
		]);

		cy.task('seedUpdateGateway2Workshop', {
			reference: 'PLAN-D01',
			workshopData: {
				workshopDate: '2027-02-15T00:00:00.000Z',
				workshopTime: '14:30',
				workshopEndTime: '16:20',
				workshopExpectedDaysKnown: 'no',
				workshopLocationType: 'in-person',
				workshopVenueName: 'London Workshop Centre',
				workshopAddressLine: '88 Test place',
				workshopAddressLine2: 'Eastside',
				workshopTownOrCity: 'Manchester',
				workshopPostcode: 'ME1 9PL'
			}
		});

		cy.reload();

		gateway2ApplicationPage.verifyWorkshopData(gateway2ApplicationPage.workshopDetailsTable, [
			['Workshop venue', 'London Workshop Centre, 88 Test place, Eastside, Manchester, ME1 9PL'],
			['Workshop date and time', '15 February 2027 at 14:30 to 16:20']
		]);
	});
});
