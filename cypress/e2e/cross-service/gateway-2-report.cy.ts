import {
	verifyGateway2ReportInPortal,
	verifyGateway2ReportNotIssuedInPortal
} from '../../flows/cross-service/gateway-2-report-flow.ts';
import { issueGateway2Report, openGateway2Page } from '../../flows/manage/gateway-2-flow.ts';
import { FOURTH_TEST_EMAIL, manageToPortalLogin } from '../../flows/portal/login-flow.ts';
import { gateway2Report } from '../../fixtures/manage/gateway-2.ts';
import { gateway2Page, gateway2ReportPage } from '../../page-objects/manage/gateway-2/index.ts';

const CASE_REFERENCE = 'PLAN-C02';
const PLAN_TITLE = 'GW2SubmittedNotIssued';
const todayDisplay = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

describe('Cross-service Gateway 2 report', () => {
	beforeEach(() => {
		cy.task('clearDb');
		cy.task('seedCase');
	});

	after(() => cy.task('clearDb'));

	it('shares issued Gateway 2 reports but hides unconfirmed replacements', { tags: ['regression'] }, () => {
		openGateway2Page(CASE_REFERENCE, PLAN_TITLE);

		manageToPortalLogin(FOURTH_TEST_EMAIL);

		openGateway2Page(CASE_REFERENCE, PLAN_TITLE);
		issueGateway2Report(PLAN_TITLE);

		verifyGateway2ReportInPortal(CASE_REFERENCE, gateway2Report.fileName, todayDisplay);

		openGateway2Page(CASE_REFERENCE, PLAN_TITLE);
		gateway2Page.openActionLinkFor(gateway2Report.row);
		gateway2ReportPage.removeFile(gateway2Report.fileName);
		gateway2ReportPage.uploadAndVerifyFile(gateway2Report.updatedFileName);

		verifyGateway2ReportNotIssuedInPortal(CASE_REFERENCE);
	});
});
