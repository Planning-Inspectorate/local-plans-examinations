import {
	gateway2Page,
	gateway2AssessorPage,
	gateway2ActualDatePage,
	gateway2ExpectedDatePage,
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
} from '../../../../page-objects/manage/gateway-2/index.ts';
import { openSeededGateway2Page } from '../../../../flows/manage/gateway-2-flow.ts';
import { cleanupSeededManageCase } from '../../../../flows/manage/seeded-case-flow.ts';
import { seededCase } from '../../../../fixtures/manage/case.ts';
import {
	gateway2AssessorAnswer,
	gateway2DateAnswers,
	gateway2Report,
	updatedGateway2ExpectedDateAnswer,
	workshopSetUp
} from '../../../../fixtures/manage/gateway-2.ts';

describe('Gateway 2 updates', () => {
	beforeEach(() => {
		cy.task('clearDb');
		openSeededGateway2Page();
	});
	afterEach(cleanupSeededManageCase);
	after(() => cy.task('clearDb'));

	it('updates a Gateway 2 date answer', { tags: ['regression'] }, () => {
		gateway2Page.openActionLinkFor(gateway2DateAnswers.gateway2ExpectedDate.row);

		gateway2ExpectedDatePage.verifyLoaded(gateway2DateAnswers.gateway2ExpectedDate.input);
		gateway2ExpectedDatePage.enterDate(updatedGateway2ExpectedDateAnswer.input);

		gateway2Page.verifyLoaded(seededCase.planTitle);
		gateway2Page.verifySummaryRowContains(
			gateway2DateAnswers.gateway2ExpectedDate.row,
			updatedGateway2ExpectedDateAnswer.display
		);
	});

	it('updates the Gateway 2 assessor name answer', { tags: ['regression'] }, () => {
		gateway2Page.openActionLinkFor(gateway2AssessorAnswer.row);

		gateway2AssessorPage.verifyLoaded();
		gateway2AssessorPage.assessorNamePopulated(gateway2AssessorAnswer.assessor1);
		gateway2AssessorPage.enterAssessorName(gateway2AssessorAnswer.assessor2);

		gateway2Page.verifyLoaded(seededCase.planTitle);
		gateway2Page.verifySummaryRowContains(gateway2AssessorAnswer.row, gateway2AssessorAnswer.assessor2);
	});

	it('uploads the Gateway 2 report', { tags: ['regression', 'environment-smoke'] }, () => {
		gateway2Page.openActionLinkFor(gateway2Report.row);
		gateway2ReportPage.verifyLoaded();

		gateway2ReportPage.uploadAndVerifyFile(gateway2Report.fileName);
		gateway2ReportPage.saveAndReturn();

		gateway2ReportCheckPage.verifyLoaded(gateway2Report.fileName);
		gateway2ReportCheckPage.issueReport();

		gateway2Page.verifyLoaded(seededCase.planTitle);
		gateway2Page.verifySummaryRowContains(gateway2Report.row, gateway2Report.fileName);
	});

	it('returns to Gateway 2 from Gateway 2 answer page back links', { tags: ['regression'] }, () => {
		gateway2Page.openActionLinkFor(gateway2DateAnswers.gateway2ActualDate.row);
		gateway2ActualDatePage.verifyLoaded(gateway2DateAnswers.gateway2ActualDate.input);
		gateway2ActualDatePage.goBack();

		gateway2Page.verifyLoaded(seededCase.planTitle);
	});

	//happy path of workshop test
	//will need fixture, page file with multiple pages

	it('sets up a new workshop event', { tags: ['regression'] }, () => {
		//gateway2Page.openActionLinkFor(fixtureforworkshopsetup) //its a link not a row

		//this will be the flow
		cy.contains('Set up workshop').click();
		workshopDateAndTimePage.verifyLoaded();
		workshopDateAndTimePage.enterDateAndTime(
			workshopSetUp.workshopDateAndTime.inputDate,
			workshopSetUp.workshopDateAndTime.inputTime
		);
		workshopExpectedDaysPage.verifyLoaded(); //make all verify loadeds  better
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
		//workshopCYAPage.verifyExpectedSeededAnswers();
		workshopCYAPage.verifyExpectedActionLinkHrefs();
		//remote link
		//cya

		//gateway2WorkshopSetUp.completeflow //use an actual flow
		//gateway2WorkshopSetUp.verifycya
		//gateway2Page.verifyLoaded(workshopstuff)
	});
});
