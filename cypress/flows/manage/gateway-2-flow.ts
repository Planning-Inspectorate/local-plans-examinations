import { gateway2Report } from '../../fixtures/manage/gateway-2.ts';
import {
	gateway2Page,
	gateway2ReportCheckPage,
	gateway2ReportPage,
	WorkshopDateAndTimePage,
	WorkshopExpectedDaysPage,
	WorkshopLocationPage,
	WorkshopAddressKnownPage,
	WorkshopVenueAddressPage,
	WorkshopRemoteLinkKnownPage,
	WorkshopRemoteLinkPage,
	WorkshopCYAPage
} from '../../page-objects/manage/gateway-2/index.ts';
import { workshopSetUp } from '../../fixtures/manage/gateway-2.ts';
import { openSeededManageCase } from './seeded-case-flow.ts';
import type { SeedCyOptions } from '../../../packages/database/src/seed/seed-cy.ts';

export const openSeededGateway2Page = (options?: SeedCyOptions) => {
	return openSeededManageCase(options).then(({ planTitle }) => {
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

export const workshopSetUpFlow = (planTitle: string, workshopNumber = 1) => {
	const workshopDateAndTimePage = new WorkshopDateAndTimePage(workshopNumber);
	const workshopExpectedDaysPage = new WorkshopExpectedDaysPage(workshopNumber);
	const workshopLocationPage = new WorkshopLocationPage(workshopNumber);
	const workshopAddressKnownPage = new WorkshopAddressKnownPage(workshopNumber);
	const workshopVenueAddressPage = new WorkshopVenueAddressPage(workshopNumber);
	const workshopRemoteLinkKnownPage = new WorkshopRemoteLinkKnownPage(workshopNumber);
	const workshopRemoteLinkPage = new WorkshopRemoteLinkPage(workshopNumber);
	const workshopCYAPage = new WorkshopCYAPage(workshopNumber);

	gateway2Page.setUpWorkshopLink.should('be.visible').and('have.text', 'Set up workshop').click();
	workshopDateAndTimePage.enterDateAndTime(
		workshopSetUp.workshopDateAndTime.inputDate,
		workshopSetUp.workshopDateAndTime.inputTime
	);
	workshopExpectedDaysPage.enterRadioAndNumberOfDays(
		workshopSetUp.expectedNumberOfDays.inputRadio,
		workshopSetUp.expectedNumberOfDays.inputDays
	);
	workshopLocationPage.verifyLoaded();
	workshopLocationPage.selectAnswer(workshopSetUp.workshopRemoteOrInPerson.inputRadio);
	workshopAddressKnownPage.verifyLoaded();
	workshopAddressKnownPage.selectAnswer(workshopSetUp.workshopAddressKnown.inputRadio);
	workshopVenueAddressPage.enterAddressDetails(
		workshopSetUp.workshopVenueAddress.values.venueName,
		workshopSetUp.workshopVenueAddress.values.addressLine1,
		workshopSetUp.workshopVenueAddress.values.townOrCity,
		workshopSetUp.workshopVenueAddress.values.postcode
	);
	workshopRemoteLinkKnownPage.verifyLoaded();
	workshopRemoteLinkKnownPage.selectAnswer(workshopSetUp.workshopMeetingLinkKnown.inputRadio);
	workshopRemoteLinkPage.enterRemoteLink(workshopSetUp.workshopMeetingLink.input);
	workshopCYAPage.verifyLoaded();
	workshopCYAPage.verifyExpectedActionLinkHrefs();
	workshopCYAPage.openChangeLinkFor(workshopSetUp.expectedNumberOfDays.row);
	workshopExpectedDaysPage.answerOption(workshopSetUp.expectedNumberOfDays.inputRadio).should('be.checked');
	workshopExpectedDaysPage.enterRadioAndNumberOfDays(
		workshopSetUp.expectedNumberOfDays.inputRadio,
		workshopSetUp.expectedNumberOfDays.updatedInputDays
	);
	workshopCYAPage.verifyLoaded();
	workshopCYAPage.verifySummaryRowContains(
		workshopSetUp.expectedNumberOfDays.rowNumberOfDays,
		workshopSetUp.expectedNumberOfDays.updatedDisplayNumberOfDays
	);
	workshopCYAPage.submitWorkshop();
	gateway2Page.verifyLoaded(planTitle);
};
