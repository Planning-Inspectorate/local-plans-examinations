import {
	gateway3Page,
	gateway3AssessorPage,
	gateway3AssessorConfirmPage,
	gateway3AssessorQuestionPath,
	gateway3AssessorRemovePath,
	gateway3RemoveAssessorPage
} from '../../../../page-objects/manage/gateway-3/index.ts';
import { caseHistoryPage } from '../../../../page-objects/manage/case-history/index.ts';
import { openSeededGateway3Page, removeGateway3Assessor } from '../../../../flows/manage/gateway-3-flow.ts';
import { cleanupSeededManageCase } from '../../../../flows/manage/seeded-case-flow.ts';
import { seededCase } from '../../../../fixtures/manage/case.ts';
import { gateway3AssessorAnswer } from '../../../../fixtures/manage/gateway-3.ts';

const todayDisplay = new Date().toLocaleDateString('en-GB', {
	day: 'numeric',
	month: 'long',
	year: 'numeric',
	timeZone: 'GMT'
});

const openCaseHistory = () => {
	gateway3Page.openServiceNavigationItem('Case History');
	caseHistoryPage.verifyLoaded();
};

const addGateway3Assessor = (assessorName: string) => {
	gateway3Page.openAddAssessor();
	gateway3AssessorPage.verifyLoaded();
	gateway3AssessorPage.enterAssessorName(assessorName);
	gateway3AssessorConfirmPage.verifyLoaded(assessorName, todayDisplay);
	gateway3AssessorConfirmPage.confirmAndSend();
	gateway3Page.verifyLoaded(seededCase.planTitle);
};

// The seeded case starts with "Assessor 1" appointed as the Gateway 3 assessor
describe('Gateway 3 assessors', () => {
	beforeEach(() => {
		cy.task('clearDb');
		openSeededGateway3Page();
	});
	afterEach(cleanupSeededManageCase);
	after(() => cy.task('clearDb'));

	it('shows the assessor and appointed date under the Assessors sub-heading', { tags: ['regression'] }, () => {
		gateway3Page.verifyAssessor(
			1,
			gateway3AssessorAnswer.display,
			gateway3AssessorAnswer.appointedDisplay,
			gateway3AssessorRemovePath
		);
	});

	it('removes the assessor and records case history', { tags: ['regression'] }, () => {
		gateway3Page.openRemoveAssessor();
		gateway3RemoveAssessorPage.verifyContent(gateway3AssessorAnswer.display);
		gateway3RemoveAssessorPage.confirmRemoval();

		gateway3Page.verifyLoaded(seededCase.planTitle);
		gateway3Page.verifyNoAssessor();
		gateway3Page.verifyAddAssessorLink(gateway3AssessorQuestionPath);

		openCaseHistory();
		caseHistoryPage.verifyHistoryEvent(`Assessor ${gateway3AssessorAnswer.display} removed`);
	});

	it('keeps the assessor when removal is cancelled or the Back link is used', { tags: ['regression'] }, () => {
		gateway3Page.openRemoveAssessor();
		gateway3RemoveAssessorPage.cancelRemoval();

		gateway3Page.verifyLoaded(seededCase.planTitle);
		gateway3Page.verifyAssessor(1, gateway3AssessorAnswer.display, gateway3AssessorAnswer.appointedDisplay);

		gateway3Page.openRemoveAssessor();
		gateway3RemoveAssessorPage.verifyLoaded();
		gateway3RemoveAssessorPage.goBack();

		gateway3Page.verifyLoaded(seededCase.planTitle);
		gateway3Page.verifyAssessor(1, gateway3AssessorAnswer.display, gateway3AssessorAnswer.appointedDisplay);
	});

	it('adds an assessor, confirms the notification and shows the success banner', { tags: ['regression'] }, () => {
		removeGateway3Assessor(seededCase.planTitle);

		gateway3Page.verifyAddAssessorLink(gateway3AssessorQuestionPath);
		gateway3Page.openAddAssessor();

		gateway3AssessorPage.verifyContent();
		gateway3AssessorPage.enterAssessorName(gateway3AssessorAnswer.assessor2);

		gateway3AssessorConfirmPage.verifyContent(gateway3AssessorAnswer.assessor2, todayDisplay);
		gateway3AssessorConfirmPage.confirmAndSend();

		gateway3Page.verifyLoaded(seededCase.planTitle);
		gateway3Page.verifyNotificationBanner('Assessor added');
		gateway3Page.verifyAssessor(1, gateway3AssessorAnswer.assessor2, todayDisplay, gateway3AssessorRemovePath);

		openCaseHistory();
		caseHistoryPage.verifyHistoryEvent(`Assessor ${gateway3AssessorAnswer.assessor2} added`);
	});

	it('adds more assessors, each in their own rows, and removes them one at a time', { tags: ['regression'] }, () => {
		// the Add assessor link stays available while the gateway already has an assessor
		gateway3Page.verifyAddAssessorLink(gateway3AssessorQuestionPath);
		addGateway3Assessor(gateway3AssessorAnswer.assessor2);

		gateway3Page.verifyNotificationBanner('Assessor added');
		gateway3Page.verifyAssessorCount(2);
		gateway3Page.verifyAssessor(
			1,
			gateway3AssessorAnswer.display,
			gateway3AssessorAnswer.appointedDisplay,
			gateway3AssessorRemovePath
		);
		gateway3Page.verifyAssessor(2, gateway3AssessorAnswer.assessor2, todayDisplay, gateway3AssessorRemovePath);

		addGateway3Assessor(gateway3AssessorAnswer.assessor3);

		gateway3Page.verifyAssessorCount(3);
		gateway3Page.verifyAssessor(1, gateway3AssessorAnswer.display, gateway3AssessorAnswer.appointedDisplay);
		gateway3Page.verifyAssessor(2, gateway3AssessorAnswer.assessor2, todayDisplay);
		gateway3Page.verifyAssessor(3, gateway3AssessorAnswer.assessor3, todayDisplay);

		// removing an assessor in the middle leaves the others in place
		gateway3Page.openRemoveAssessor(2);
		gateway3RemoveAssessorPage.verifyContent(gateway3AssessorAnswer.assessor2);
		gateway3RemoveAssessorPage.confirmRemoval();

		gateway3Page.verifyLoaded(seededCase.planTitle);
		gateway3Page.verifyAssessorCount(2);
		gateway3Page.verifyAssessor(1, gateway3AssessorAnswer.display, gateway3AssessorAnswer.appointedDisplay);
		gateway3Page.verifyAssessor(2, gateway3AssessorAnswer.assessor3, todayDisplay);

		// removing the first assessor moves the remaining assessor up to "Assessor 1"
		gateway3Page.openRemoveAssessor(1);
		gateway3RemoveAssessorPage.verifyContent(gateway3AssessorAnswer.display);
		gateway3RemoveAssessorPage.confirmRemoval();

		gateway3Page.verifyLoaded(seededCase.planTitle);
		gateway3Page.verifyAssessorCount(1);
		gateway3Page.verifyAssessor(1, gateway3AssessorAnswer.assessor3, todayDisplay);

		openCaseHistory();
		caseHistoryPage.verifyHistoryEvent(`Assessor ${gateway3AssessorAnswer.assessor2} added`);
		caseHistoryPage.verifyHistoryEvent(`Assessor ${gateway3AssessorAnswer.assessor3} added`);
		caseHistoryPage.verifyHistoryEvent(`Assessor ${gateway3AssessorAnswer.assessor2} removed`);
		caseHistoryPage.verifyHistoryEvent(`Assessor ${gateway3AssessorAnswer.display} removed`);
	});

	it('changes the chosen assessor from the confirm page before sending', { tags: ['regression'] }, () => {
		removeGateway3Assessor(seededCase.planTitle);
		gateway3Page.openAddAssessor();
		gateway3AssessorPage.verifyLoaded();
		gateway3AssessorPage.enterAssessorName(gateway3AssessorAnswer.assessor2);

		gateway3AssessorConfirmPage.verifyLoaded(gateway3AssessorAnswer.assessor2);
		gateway3AssessorConfirmPage.changeAssessor();

		gateway3AssessorPage.verifyLoaded();
		gateway3AssessorPage.assessorNamePopulated(gateway3AssessorAnswer.assessor2);
		gateway3AssessorPage.enterAssessorName(gateway3AssessorAnswer.assessor3);

		gateway3AssessorConfirmPage.verifyLoaded(gateway3AssessorAnswer.assessor3);
		gateway3AssessorConfirmPage.confirmAndSend();

		gateway3Page.verifyLoaded(seededCase.planTitle);
		gateway3Page.verifyAssessor(1, gateway3AssessorAnswer.assessor3, todayDisplay);
	});

	it('does not add an assessor when leaving the add assessor page with the Back link', { tags: ['regression'] }, () => {
		removeGateway3Assessor(seededCase.planTitle);
		gateway3Page.openAddAssessor();
		gateway3AssessorPage.verifyLoaded();
		gateway3AssessorPage.goBack();

		gateway3Page.verifyLoaded(seededCase.planTitle);
		gateway3Page.verifyNoAssessor();
	});

	it('does not add an assessor until the notification is confirmed', { tags: ['regression'] }, () => {
		removeGateway3Assessor(seededCase.planTitle);

		cy.location('pathname').then((gateway3TabUrl) => {
			gateway3Page.openAddAssessor();
			gateway3AssessorPage.verifyLoaded();
			gateway3AssessorPage.enterAssessorName(gateway3AssessorAnswer.assessor2);
			gateway3AssessorConfirmPage.verifyLoaded(gateway3AssessorAnswer.assessor2);

			// the confirm page has no case tabs, so leave it by going straight back to the Gateway 3 tab
			gateway3Page.visit(gateway3TabUrl);

			gateway3Page.verifyLoaded(seededCase.planTitle);
			gateway3Page.verifyNoAssessor();
		});
	});
});
