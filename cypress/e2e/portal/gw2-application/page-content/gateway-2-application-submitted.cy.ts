import {
	portalLogin,
	THIRD_TEST_EMAIL,
	FOURTH_TEST_EMAIL,
	FIFTH_TEST_EMAIL
} from '../../../../flows/portal/login-flow.ts';
import { gateway2ApplicationPage } from '../../../../page-objects/portal/gw2-application/gateway-2-application-page.ts';
import type { Gateway2ReportIssuedFixture } from '../../../../fixtures/portal/types.ts';
import { gateway2SubmittedPlan } from '../../../../fixtures/portal/gateway-2-uploads.ts';
import { openGateway2ApplicationPage } from '../../../../flows/portal/plan-flow.ts';

const loadReportIssuedPlan = () => cy.fixture<Gateway2ReportIssuedFixture>('portal/gateway-2-report-issued.json');

describe('Gateway 2 application page content after submission', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin(FOURTH_TEST_EMAIL);
		cy.task('seedGateway2SubmittedDocuments');
		gateway2ApplicationPage.visit(gateway2SubmittedPlan.reference);
	});

	afterEach(() => cy.task('clearDb'));

	it('Shows the Gateway 2 submission data has been recorded correctly', { tags: ['regression'] }, () => {
		gateway2ApplicationPage.verifySubmittedApplication(gateway2SubmittedPlan.submittedDate, FOURTH_TEST_EMAIL);
	});

	it('shows an online workshop meeting link without a venue or unuploaded documents', { tags: ['regression'] }, () => {
		const meetingLink = 'https://teams.example.com/workshop';
		cy.task('seedUpdateGateway2Workshop', {
			reference: gateway2SubmittedPlan.reference,
			workshopData: {
				workshopDate: '2027-02-15T00:00:00.000Z',
				workshopTime: '14:30',
				workshopLocationType: 'remote',
				remoteMeetingLinkKnown: 'yes',
				remoteMeetingLink: meetingLink
			}
		});
		cy.reload();
		gateway2ApplicationPage.verifyRemoteWorkshopWithoutDocuments(meetingLink);
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
			gateway2ApplicationPage.verifyStatusTag(plan.completed);
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
			['Format', 'In-person'],
			['Venue', 'Conference Hall', '12 Milton Lane', 'Westside', 'London', 'WW1 2RT'],
			['Start time', '11:44am, 8 March 2027'],
			['Documents', 'test-document.docx', 'test-document.pdf', `(shared: ${dateShared}`]
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
			['Format', 'In-person'],
			['Venue', 'London Workshop Centre', '88 Test place', 'Eastside', 'Manchester', 'ME1 9PL'],
			['Start time', '2:30pm, 15 February 2027']
		]);
	});
});
