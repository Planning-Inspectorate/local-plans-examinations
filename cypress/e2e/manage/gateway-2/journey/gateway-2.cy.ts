import {
	gateway2Page,
	workshopVenuePage,
	gateway2AssessorPage,
	gateway2ActualDatePage,
	gateway2EstimatedDatePage
} from '../../../../page-objects/manage/gateway-2/index.ts';
import { openSeededGateway2Page } from '../../../../flows/manage/gateway-2-flow.ts';
import {
	gateway2AssessorAnswer,
	gateway2DateAnswers,
	workshopVenueAnswer,
	updatedGateway2EstimatedDateAnswer
} from '../../../../fixtures/manage/gateway-2.ts';

describe('Gateway 2 updates', () => {
	beforeEach(() => {
		cy.task('clearDb');
		openSeededGateway2Page();
	});
	after(() => cy.task('clearDb'));

	it('updates a Gateway 2 date answer', { tags: ['regression'] }, () => {
		gateway2Page.openActionLinkFor(gateway2DateAnswers.gateway2EstimatedDate.row);

		gateway2EstimatedDatePage.verifyLoaded(gateway2DateAnswers.gateway2EstimatedDate.input);
		gateway2EstimatedDatePage.enterDate(updatedGateway2EstimatedDateAnswer.input);

		gateway2Page.verifyLoaded('Cypress Test Plan');
		gateway2Page.verifySummaryRowContains(
			gateway2DateAnswers.gateway2EstimatedDate.row,
			updatedGateway2EstimatedDateAnswer.display
		);
	});

	it('updates the Gateway 2 assessor name answer', { tags: ['regression'] }, () => {
		gateway2Page.openActionLinkFor(gateway2AssessorAnswer.row);

		gateway2AssessorPage.verifyLoaded(gateway2AssessorAnswer.heading);
		gateway2AssessorPage.assessorNamePopulated(gateway2AssessorAnswer.assessor1);
		gateway2AssessorPage.enterAssessorName(gateway2AssessorAnswer.assessor2);

		gateway2Page.verifyLoaded('Cypress Test Plan');
		gateway2Page.verifySummaryRowContains(gateway2AssessorAnswer.row, gateway2AssessorAnswer.assessor2);
	});

	it('updates the workshop venue answer', { tags: ['regression'] }, () => {
		gateway2Page.openActionLinkFor(workshopVenueAnswer.row);

		workshopVenuePage.verifyLoaded(workshopVenueAnswer.heading);
		workshopVenuePage.verifyWorkshopVenueForm(workshopVenueAnswer.value);
		workshopVenuePage.enterWorkshopVenue(workshopVenueAnswer.updatedValue);

		gateway2Page.verifyLoaded('Cypress Test Plan');
		gateway2Page.verifySummaryRowContains(workshopVenueAnswer.row, workshopVenueAnswer.updatedValue);
	});

	it('returns to Gateway 2 from Gateway 2 answer page back links', { tags: ['regression'] }, () => {
		gateway2Page.openActionLinkFor(gateway2DateAnswers.gateway2ActualDate.row);
		gateway2ActualDatePage.verifyLoaded(gateway2DateAnswers.gateway2ActualDate.input);
		gateway2ActualDatePage.goBack();

		gateway2Page.verifyLoaded('Cypress Test Plan');

		gateway2Page.openActionLinkFor(workshopVenueAnswer.row);
		workshopVenuePage.verifyLoaded(workshopVenueAnswer.heading);
		workshopVenuePage.goBack();

		gateway2Page.verifyLoaded('Cypress Test Plan');
	});
});
