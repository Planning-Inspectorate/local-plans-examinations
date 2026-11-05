import { openSeededManageCase } from '../../../../flows/manage/seeded-case-flow.ts';
import { seededCase } from '../../../../fixtures/manage/case.ts';
import { seededTimetable } from '../../../../fixtures/manage/timetable.ts';
import { gateway2DateAnswers, updatedGateway2ExpectedDateAnswer } from '../../../../fixtures/manage/gateway-2.ts';
import { gateway3DateAnswers } from '../../../../fixtures/manage/gateway-3.ts';
import { letterSentToMHCLGDate } from '../../../../fixtures/manage/examination.ts';
import { caseOverviewPage } from '../../../../page-objects/manage/case-overview/index.ts';
import { gateway2Page } from '../../../../page-objects/manage/gateway-2/index.ts';
import { examinationPage, letterSentToMHCLGDatePage } from '../../../../page-objects/manage/examination/index.ts';
import {
	timetablePage,
	timetableGateway2ExpectedDatePage
} from '../../../../page-objects/manage/timetable/timetable-page.ts';

describe('Timetable date updates', () => {
	beforeEach(() => {
		cy.task('clearDb');
		openSeededManageCase(seededTimetable);
		caseOverviewPage.openServiceNavigationItem('Timetable');
	});

	after(() => cy.task('clearDb'));

	it('reflects a Timetable date change on Gateway 2 without changing Gateway 3', { tags: ['regression'] }, () => {
		timetablePage.openSectionAction('Gateway 2', gateway2DateAnswers.gateway2ExpectedDate.row);
		timetableGateway2ExpectedDatePage.enterDate(updatedGateway2ExpectedDateAnswer.input);
		timetablePage.verifySectionAnswer(
			'Gateway 2',
			gateway2DateAnswers.gateway2ExpectedDate.row,
			updatedGateway2ExpectedDateAnswer.display
		);
		timetablePage.verifySectionAnswer(
			'Gateway 3',
			gateway3DateAnswers.gateway3ExpectedDate.row,
			gateway3DateAnswers.gateway3ExpectedDate.display
		);
		timetablePage.openServiceNavigationItem('Gateway 2');
		cy.reload();
		gateway2Page.verifyLoaded(seededCase.planTitle);
		gateway2Page.verifySummaryRowContains(
			gateway2DateAnswers.gateway2ExpectedDate.row,
			updatedGateway2ExpectedDateAnswer.display
		);
	});

	it('reflects an Examination date change on Timetable after refresh', { tags: ['regression'] }, () => {
		timetablePage.openServiceNavigationItem('Examination');
		examinationPage.openActionLinkFor(letterSentToMHCLGDate.row);
		letterSentToMHCLGDatePage.enterDate(letterSentToMHCLGDate.updatedInput);
		examinationPage.verifyLoaded(seededCase.planTitle);
		examinationPage.verifySummaryRowContains(letterSentToMHCLGDate.row, letterSentToMHCLGDate.updatedDisplay);
		examinationPage.openServiceNavigationItem('Timetable');
		cy.reload();
		timetablePage.verifySectionAnswer('Examination', letterSentToMHCLGDate.row, letterSentToMHCLGDate.updatedDisplay);
	});
});
