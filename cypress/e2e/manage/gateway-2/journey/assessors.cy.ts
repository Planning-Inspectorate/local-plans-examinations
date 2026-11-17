import {
	gateway2Page,
	gateway2AssessorPage,
	gateway2AssessorConfirmPage,
	gateway2AssessorQuestionPath,
	gateway2AssessorRemovePath,
	gateway2RemoveAssessorPage
} from '../../../../page-objects/manage/gateway-2/index.ts';
import { caseHistoryPage } from '../../../../page-objects/manage/case-history/index.ts';
import { openSeededGateway2Page, removeGateway2Assessor } from '../../../../flows/manage/gateway-2-flow.ts';
import { cleanupSeededManageCase } from '../../../../flows/manage/seeded-case-flow.ts';
import { seededCase } from '../../../../fixtures/manage/case.ts';
import { gateway2AssessorAnswer } from '../../../../fixtures/manage/gateway-2.ts';
import {
	caseOverviewPage,
	caseOverviewGateway2AssessorPage
} from '../../../../page-objects/manage/case-overview/index.ts';
import { assessorGateway2 } from '../../../../fixtures/manage/overview.ts';

const todayDisplay = new Date().toLocaleDateString('en-GB', {
	day: 'numeric',
	month: 'long',
	year: 'numeric',
	timeZone: 'GMT'
});

const openCaseHistory = () => {
	gateway2Page.openServiceNavigationItem('Case History');
	caseHistoryPage.verifyLoaded();
};

const addGateway2Assessor = (assessorName: string) => {
	gateway2Page.openAddAssessor();
	gateway2AssessorPage.verifyLoaded();
	gateway2AssessorPage.enterAssessorName(assessorName);
	gateway2AssessorConfirmPage.verifyLoaded(assessorName, todayDisplay);
	gateway2AssessorConfirmPage.confirmAndSend();
	gateway2Page.verifyLoaded(seededCase.planTitle);
};

// The seeded case starts with "Assessor 1" appointed as the Gateway 2 assessor
describe('Gateway 2 assessors', () => {
	beforeEach(() => {
		cy.task('clearDb');
		openSeededGateway2Page();
	});
	afterEach(cleanupSeededManageCase);
	after(() => cy.task('clearDb'));

	it('shows the assessor and appointed date under the Assessors sub-heading', { tags: ['regression'] }, () => {
		gateway2Page.verifyAssessor(
			1,
			gateway2AssessorAnswer.display,
			gateway2AssessorAnswer.appointedDisplay,
			gateway2AssessorRemovePath
		);
	});

	it('removes the assessor and records case history', { tags: ['regression'] }, () => {
		gateway2Page.openRemoveAssessor();
		gateway2RemoveAssessorPage.verifyContent(gateway2AssessorAnswer.display);
		gateway2RemoveAssessorPage.confirmRemoval();

		gateway2Page.verifyLoaded(seededCase.planTitle);
		gateway2Page.verifyNoAssessor();
		gateway2Page.verifyAddAssessorLink(gateway2AssessorQuestionPath);

		openCaseHistory();
		caseHistoryPage.verifyHistoryEvent(`Assessor ${gateway2AssessorAnswer.display} removed`);
	});

	it('keeps the assessor when removal is cancelled or the Back link is used', { tags: ['regression'] }, () => {
		gateway2Page.openRemoveAssessor();
		gateway2RemoveAssessorPage.cancelRemoval();

		gateway2Page.verifyLoaded(seededCase.planTitle);
		gateway2Page.verifyAssessor(1, gateway2AssessorAnswer.display, gateway2AssessorAnswer.appointedDisplay);

		gateway2Page.openRemoveAssessor();
		gateway2RemoveAssessorPage.verifyLoaded();
		gateway2RemoveAssessorPage.goBack();

		gateway2Page.verifyLoaded(seededCase.planTitle);
		gateway2Page.verifyAssessor(1, gateway2AssessorAnswer.display, gateway2AssessorAnswer.appointedDisplay);
	});

	it('adds an assessor, confirms the notification and shows the success banner', { tags: ['regression'] }, () => {
		removeGateway2Assessor(seededCase.planTitle);

		gateway2Page.verifyAddAssessorLink(gateway2AssessorQuestionPath);
		gateway2Page.openAddAssessor();

		gateway2AssessorPage.verifyContent();
		gateway2AssessorPage.enterAssessorName(gateway2AssessorAnswer.assessor2);

		gateway2AssessorConfirmPage.verifyContent(gateway2AssessorAnswer.assessor2, todayDisplay);
		gateway2AssessorConfirmPage.confirmAndSend();

		gateway2Page.verifyLoaded(seededCase.planTitle);
		gateway2Page.verifyNotificationBanner('Assessor added');
		gateway2Page.verifyAssessor(1, gateway2AssessorAnswer.assessor2, todayDisplay, gateway2AssessorRemovePath);

		openCaseHistory();
		caseHistoryPage.verifyHistoryEvent(`Assessor ${gateway2AssessorAnswer.assessor2} added`);
	});

	it('adds more assessors, each in their own rows, and removes them one at a time', { tags: ['regression'] }, () => {
		// the Add assessor link stays available while the gateway already has an assessor
		gateway2Page.verifyAddAssessorLink(gateway2AssessorQuestionPath);
		addGateway2Assessor(gateway2AssessorAnswer.assessor2);

		gateway2Page.verifyNotificationBanner('Assessor added');
		gateway2Page.verifyAssessorCount(2);
		gateway2Page.verifyAssessor(
			1,
			gateway2AssessorAnswer.display,
			gateway2AssessorAnswer.appointedDisplay,
			gateway2AssessorRemovePath
		);
		gateway2Page.verifyAssessor(2, gateway2AssessorAnswer.assessor2, todayDisplay, gateway2AssessorRemovePath);

		addGateway2Assessor(gateway2AssessorAnswer.assessor3);

		gateway2Page.verifyAssessorCount(3);
		gateway2Page.verifyAssessor(1, gateway2AssessorAnswer.display, gateway2AssessorAnswer.appointedDisplay);
		gateway2Page.verifyAssessor(2, gateway2AssessorAnswer.assessor2, todayDisplay);
		gateway2Page.verifyAssessor(3, gateway2AssessorAnswer.assessor3, todayDisplay);

		// removing an assessor in the middle leaves the others in place
		gateway2Page.openRemoveAssessor(2);
		gateway2RemoveAssessorPage.verifyContent(gateway2AssessorAnswer.assessor2);
		gateway2RemoveAssessorPage.confirmRemoval();

		gateway2Page.verifyLoaded(seededCase.planTitle);
		gateway2Page.verifyAssessorCount(2);
		gateway2Page.verifyAssessor(1, gateway2AssessorAnswer.display, gateway2AssessorAnswer.appointedDisplay);
		gateway2Page.verifyAssessor(2, gateway2AssessorAnswer.assessor3, todayDisplay);

		// removing the first assessor moves the remaining assessor up to "Assessor 1"
		gateway2Page.openRemoveAssessor(1);
		gateway2RemoveAssessorPage.verifyContent(gateway2AssessorAnswer.display);
		gateway2RemoveAssessorPage.confirmRemoval();

		gateway2Page.verifyLoaded(seededCase.planTitle);
		gateway2Page.verifyAssessorCount(1);
		gateway2Page.verifyAssessor(1, gateway2AssessorAnswer.assessor3, todayDisplay);

		openCaseHistory();
		caseHistoryPage.verifyHistoryEvent(`Assessor ${gateway2AssessorAnswer.assessor2} added`);
		caseHistoryPage.verifyHistoryEvent(`Assessor ${gateway2AssessorAnswer.assessor3} added`);
		caseHistoryPage.verifyHistoryEvent(`Assessor ${gateway2AssessorAnswer.assessor2} removed`);
		caseHistoryPage.verifyHistoryEvent(`Assessor ${gateway2AssessorAnswer.display} removed`);
	});

	it(
		'shows the first assessor on the Overview tab, and the next assessor once the first one is removed',
		{ tags: ['regression'] },
		() => {
			addGateway2Assessor(gateway2AssessorAnswer.assessor2);

			gateway2Page.openServiceNavigationItem('Overview');
			caseOverviewPage.verifyLoaded(seededCase.planTitle);
			caseOverviewPage.verifySummaryRowContains(assessorGateway2.row, gateway2AssessorAnswer.display);

			caseOverviewPage.openServiceNavigationItem('Gateway 2');
			gateway2Page.verifyLoaded(seededCase.planTitle);
			gateway2Page.openRemoveAssessor(1);
			gateway2RemoveAssessorPage.confirmRemoval();
			gateway2Page.verifyLoaded(seededCase.planTitle);

			gateway2Page.openServiceNavigationItem('Overview');
			caseOverviewPage.verifyLoaded(seededCase.planTitle);
			caseOverviewPage.verifySummaryRowContains(assessorGateway2.row, gateway2AssessorAnswer.assessor2);
		}
	);

	it(
		'changes the assessor from the Overview tab and shows the value and appointed date',
		{ tags: ['regression'] },
		() => {
			gateway2Page.openServiceNavigationItem('Overview');
			caseOverviewPage.verifyLoaded(seededCase.planTitle);
			caseOverviewPage.openActionLinkFor(assessorGateway2.row);

			caseOverviewGateway2AssessorPage.verifyLoaded();
			caseOverviewGateway2AssessorPage.verifyLookupAnswer(gateway2AssessorAnswer.assessor1);
			caseOverviewGateway2AssessorPage.enterLookupAnswer(gateway2AssessorAnswer.assessor2);

			caseOverviewPage.openServiceNavigationItem('Gateway 2');
			gateway2Page.verifyLoaded(seededCase.planTitle);
			gateway2Page.verifyAssessor(1, gateway2AssessorAnswer.assessor2, todayDisplay);

			openCaseHistory();
			caseHistoryPage.verifyHistoryEvent(
				`${gateway2AssessorAnswer.historyLabel} updated from ${gateway2AssessorAnswer.value} to ${gateway2AssessorAnswer.updatedValue}`
			);
		}
	);

	it('changes the chosen assessor from the confirm page before sending', { tags: ['regression'] }, () => {
		removeGateway2Assessor(seededCase.planTitle);
		gateway2Page.openAddAssessor();
		gateway2AssessorPage.verifyLoaded();
		gateway2AssessorPage.enterAssessorName(gateway2AssessorAnswer.assessor2);

		gateway2AssessorConfirmPage.verifyLoaded(gateway2AssessorAnswer.assessor2);
		gateway2AssessorConfirmPage.changeAssessor();

		gateway2AssessorPage.verifyLoaded();
		gateway2AssessorPage.assessorNamePopulated(gateway2AssessorAnswer.assessor2);
		gateway2AssessorPage.enterAssessorName(gateway2AssessorAnswer.assessor3);

		gateway2AssessorConfirmPage.verifyLoaded(gateway2AssessorAnswer.assessor3);
		gateway2AssessorConfirmPage.confirmAndSend();

		gateway2Page.verifyLoaded(seededCase.planTitle);
		gateway2Page.verifyAssessor(1, gateway2AssessorAnswer.assessor3, todayDisplay);
	});

	it('does not add an assessor when leaving the add assessor page with the Back link', { tags: ['regression'] }, () => {
		removeGateway2Assessor(seededCase.planTitle);
		gateway2Page.openAddAssessor();
		gateway2AssessorPage.verifyLoaded();
		gateway2AssessorPage.goBack();

		gateway2Page.verifyLoaded(seededCase.planTitle);
		gateway2Page.verifyNoAssessor();
	});

	it(
		'does not add an assessor when leaving the Confirm and send notification page without confirming',
		{ tags: ['regression'] },
		() => {
			removeGateway2Assessor(seededCase.planTitle);

			cy.location('pathname').then((gateway2TabUrl) => {
				gateway2Page.openAddAssessor();
				gateway2AssessorPage.verifyLoaded();
				gateway2AssessorPage.enterAssessorName(gateway2AssessorAnswer.assessor2);
				gateway2AssessorConfirmPage.verifyLoaded(gateway2AssessorAnswer.assessor2);

				// the confirm page has no case tabs, so leave it by going straight back to the Gateway 2 tab
				gateway2Page.visit(gateway2TabUrl);

				gateway2Page.verifyLoaded(seededCase.planTitle);
				gateway2Page.verifyNoAssessor();
			});
		}
	);
});
