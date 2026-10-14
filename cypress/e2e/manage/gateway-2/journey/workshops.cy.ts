import { openSeededGateway2Page, workshopSetUpFlow } from '../../../../flows/manage/gateway-2-flow.ts';
import { cleanupSeededManageCase } from '../../../../flows/manage/seeded-case-flow.ts';
import { seededCase } from '../../../../fixtures/manage/case.ts';
import {
	seededGateway2Workshop,
	seededWorkshopMeetingLink,
	workshopSetUp
} from '../../../../fixtures/manage/gateway-2.ts';
import {
	gateway2Page,
	cancelWorkshopPage,
	workshopCYAPage,
	workshopLocationPage
} from '../../../../page-objects/manage/gateway-2/index.ts';
import { caseHistoryPage } from '../../../../page-objects/manage/case-history/index.ts';

describe('Gateway 2 workshops', () => {
	beforeEach(() => {
		cy.task('clearDb');
		openSeededGateway2Page({ workshops: [seededGateway2Workshop] });
	});

	afterEach(cleanupSeededManageCase);
	after(() => cy.task('clearDb'));

	it('cancels a workshop and records it in case history', { tags: ['regression'] }, () => {
		gateway2Page.cancelWorkshopLink(1).should('be.visible').and('have.text', 'Cancel workshop 1').click();
		cancelWorkshopPage.verifyLoaded();
		cancelWorkshopPage.verifyContent();
		cancelWorkshopPage.doNotCancelLink.click();
		gateway2Page.verifyLoaded(seededCase.planTitle);
		gateway2Page.workshopDetails(1).should('contain.text', seededGateway2Workshop.remoteMeetingLink);

		gateway2Page.cancelWorkshopLink(1).click();
		cancelWorkshopPage.cancelButton.click();
		gateway2Page.verifyLoaded(seededCase.planTitle);
		cy.reload();
		gateway2Page.verifyWorkshopOrder();
		gateway2Page.cancelWorkshopLink(1).should('not.exist');
		gateway2Page.mainContent.should('not.contain.text', seededGateway2Workshop.remoteMeetingLink);

		gateway2Page.openServiceNavigationItem('Case History');
		caseHistoryPage.verifyLoaded();
		caseHistoryPage.verifyHistoryEvent('Workshop cancelled');
	});

	it('sets up and updates a second workshop below the existing workshop', { tags: ['regression'] }, () => {
		workshopSetUpFlow(seededCase.planTitle, 2);

		cy.reload();
		gateway2Page.verifyWorkshopOrder(1, 2);
		gateway2Page.workshopDetails(1).should('contain.text', seededGateway2Workshop.remoteMeetingLink);
		gateway2Page.verifyWorkshopSetUp(2, workshopSetUp.expectedNumberOfDays.updatedDisplayNumberOfDays);
		gateway2Page.openServiceNavigationItem('Case History');
		caseHistoryPage.verifyLoaded();
		caseHistoryPage.verifyHistoryEvent('Workshop set up');
	});

	it('changes a seeded hybrid workshop to remote without retaining its venue', { tags: ['regression'] }, () => {
		gateway2Page.openWorkshop(1);
		workshopCYAPage.verifyLoaded();
		workshopCYAPage.verifySummaryRowContains(
			workshopSetUp.workshopVenueAddress.row,
			seededGateway2Workshop.workshopVenueName
		);
		workshopCYAPage.openChangeLinkFor(workshopSetUp.workshopRemoteOrInPerson.row);
		workshopLocationPage.verifyLoaded(seededGateway2Workshop.workshopLocationType);
		workshopLocationPage.selectAnswer('remote');

		workshopCYAPage.verifyLoaded();
		workshopCYAPage.verifyRemoteWorkshopDetails(seededWorkshopMeetingLink.display);
		workshopCYAPage.submitWorkshop();

		gateway2Page.verifyLoaded(seededCase.planTitle);
		cy.reload();
		gateway2Page.verifyWorkshopOrder(1);
		gateway2Page.verifyRemoteWorkshopDetails(1, seededGateway2Workshop.remoteMeetingLink);
	});
});
