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
	updatedWorkshopVenueAnswer,
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

	it('updates the Gateway 2 assessor answer', { tags: ['regression'] }, () => {
		gateway2Page.openActionLinkFor(gateway2AssessorAnswer.row);

		gateway2AssessorPage.verifyLoaded(gateway2AssessorAnswer.assessor1);
		gateway2AssessorPage.selectAssessorName(gateway2AssessorAnswer.Assessor2);

		gateway2Page.verifyLoaded('Cypress Test Plan');
		gateway2Page.verifySummaryRowContains(gateway2AssessorAnswer.row, gateway2AssessorAnswer.Assessor2);
	});

	it('updates the workshop venue answer', { tags: ['regression'] }, () => {
		gateway2Page.openActionLinkFor(workshopVenueAnswer.row);

		workshopVenuePage.verifyLoaded(workshopVenueAnswer.value);
		workshopVenuePage.enterWorkshopVenue(updatedWorkshopVenueAnswer.value);

		gateway2Page.verifyLoaded('Cypress Test Plan');
		gateway2Page.verifySummaryRowContains(workshopVenueAnswer.row, updatedWorkshopVenueAnswer.value);
	});

	it('returns to Gateway 2 from Gateway 2 answer page back links', { tags: ['regression'] }, () => {
		gateway2Page.openActionLinkFor(gateway2DateAnswers.gateway2ActualDate.row);
		gateway2ActualDatePage.verifyLoaded(gateway2DateAnswers.gateway2ActualDate.input);
		gateway2ActualDatePage.goBack();

		gateway2Page.verifyLoaded('Cypress Test Plan');

		gateway2Page.openActionLinkFor(workshopVenueAnswer.row);
		workshopVenuePage.verifyLoaded(workshopVenueAnswer.value);
		workshopVenuePage.goBack();

		gateway2Page.verifyLoaded('Cypress Test Plan');
	});
});
