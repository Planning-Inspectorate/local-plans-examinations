import { gateway2Report } from '../../fixtures/manage/gateway-2.ts';
import {
	gateway2Page,
	gateway2ReportCheckPage,
	gateway2ReportPage
} from '../../page-objects/manage/gateway-2/index.ts';
import { openSeededManageCase } from './seeded-case-flow.ts';

export const openSeededGateway2Page = () => {
	return openSeededManageCase().then(({ planTitle }) => {
		gateway2Page.openServiceNavigationItem('Gateway 2');
		gateway2Page.verifyLoaded(planTitle);
	});
};

export const openGateway2Page = (reference: string, planTitle: string) => {
	cy.visit(`/case/${encodeURIComponent(reference)}/gateway-2`);
	gateway2Page.verifyLoaded(planTitle);
};

export const issueGateway2Report = (planTitle: string) => {
	gateway2Page.openActionLinkFor(gateway2Report.row);
	gateway2ReportPage.verifyLoaded();

	gateway2ReportPage.uploadAndVerifyFile(gateway2Report.fileName, gateway2Report.fieldName);
	gateway2ReportPage.saveAndReturn();

	gateway2ReportCheckPage.verifyLoaded(gateway2Report.fileName);
	gateway2ReportCheckPage.issueReport();

	gateway2Page.verifyLoaded(planTitle);
	gateway2Page.verifySummaryRowContains(gateway2Report.row, gateway2Report.fileName);
};
