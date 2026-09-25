import { verifyGateway2ReportInPortal } from '../../flows/cross-service/gateway-2-report-flow.ts';
import { issueGateway2Report, openGateway2Page } from '../../flows/manage/gateway-2-flow.ts';
import { FOURTH_TEST_EMAIL, manageToPortalLogin } from '../../flows/portal/login-flow.ts';
import { gateway2Report } from '../../fixtures/manage/gateway-2.ts';

const CASE_REFERENCE = 'PLAN-C02';
const PLAN_TITLE = 'GW2SubmittedNotIssued';
const todayDisplay = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

describe('Cross-service Gateway 2 report', () => {
	beforeEach(() => {
		cy.task('clearDb');
		cy.task('seedCase');
	});

	after(() => cy.task('clearDb'));

	it('Shows the shared report for Gateway 2 in Portal once it is issued in Manage', () => {
		openGateway2Page(CASE_REFERENCE, PLAN_TITLE);

		manageToPortalLogin(FOURTH_TEST_EMAIL);

		openGateway2Page(CASE_REFERENCE, PLAN_TITLE);
		issueGateway2Report(PLAN_TITLE);

		verifyGateway2ReportInPortal(CASE_REFERENCE, gateway2Report.fileName, todayDisplay);
	});
});
