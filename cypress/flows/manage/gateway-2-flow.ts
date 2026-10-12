import { gateway2Report } from '../../fixtures/manage/gateway-2.ts';
import {
	gateway2Page,
	gateway2ReportCheckPage,
	gateway2ReportPage,
	workshopDateAndTimePage,
	workshopExpectedDaysPage,
	workshopLocationPage,
	workshopAddressKnownPage,
	workshopVenueAddressPage,
	workshopRemoteLinkKnownPage,
	workshopRemoteLinkPage,
	workshopCYAPage
} from '../../page-objects/manage/gateway-2/index.ts';
import { workshopSetUp } from '../../fixtures/manage/gateway-2.ts';
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

	gateway2ReportPage.uploadAndVerifyFile(gateway2Report.fileName);
	gateway2ReportPage.saveAndReturn();

	gateway2ReportCheckPage.verifyLoaded(gateway2Report.fileName);
	gateway2ReportCheckPage.issueReport();

	gateway2Page.verifyLoaded(planTitle);
	gateway2Page.verifySummaryRowContains(gateway2Report.row, gateway2Report.fileName);
};

export const workshopSetUpFlow = (planTitle: string) => {
	cy.contains('Set up workshop').click(); //improve this
	workshopDateAndTimePage.verifyLoaded();
	workshopDateAndTimePage.enterDateAndTime(
		workshopSetUp.workshopDateAndTime.inputDate,
		workshopSetUp.workshopDateAndTime.inputTime //maybe add optional end time too
	);
	workshopExpectedDaysPage.verifyLoaded(); //make all verify loadeds better
	workshopExpectedDaysPage.enterRadioAndNumberOfDays(
		workshopSetUp.expectedNumberOfDays.inputRadio,
		workshopSetUp.expectedNumberOfDays.inputDays
	);
	workshopLocationPage.verifyLoaded();
	workshopLocationPage.selectAnswer(workshopSetUp.workshopRemoteOrInPerson.inputRadio);
	workshopAddressKnownPage.verifyLoaded();
	workshopAddressKnownPage.selectAnswer(workshopSetUp.workshopAddressKnown.inputRadio);
	workshopVenueAddressPage.verifyLoaded();
	workshopVenueAddressPage.enterAddressDetails(
		workshopSetUp.workshopVenueAddress.values.venueName,
		workshopSetUp.workshopVenueAddress.values.addressLine1,
		workshopSetUp.workshopVenueAddress.values.townOrCity,
		workshopSetUp.workshopVenueAddress.values.postcode
	);
	workshopRemoteLinkKnownPage.verifyLoaded();
	workshopRemoteLinkKnownPage.selectAnswer(workshopSetUp.workshopMeetingLinkKnown.inputRadio);
	workshopRemoteLinkPage.verifyLoaded();
	workshopRemoteLinkPage.enterRemoteLink(workshopSetUp.workshopMeetingLink.input);
	workshopCYAPage.verifyLoaded();
	workshopCYAPage.verifyExpectedRows();
	workshopCYAPage.verifyExpectedSeededAnswers();
	workshopCYAPage.verifyExpectedActionLinkHrefs();
	workshopCYAPage.submitWorkshop();
	gateway2Page.verifyLoaded(planTitle);
};
