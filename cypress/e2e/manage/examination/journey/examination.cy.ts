import { caseHistoryPage } from '../../../../page-objects/manage/case-history/index.ts';
import { openSeededExaminationPage } from '../../../../flows/manage/examination-flow.ts';
import {
	factCheckActualDate,
	factCheckDateReceivedFromInspector,
	factCheckDueDate,
	factCheckReceivedBackFromLpaDate,
	finalReportIssueDate,
	letterSentToMHCLGDate,
	QADateAnswers,
	QAInspectorsAnswers
} from '../../../../fixtures/manage/examination.ts';
import {
	examinationPage,
	factCheckActualDatePage,
	factCheckDateReceivedFromInspectorPage,
	factCheckDueDatePage,
	factCheckReceivedBackFromLpaDatePage,
	finalReportIssueDatePage,
	letterSentToMHCLGDatePage,
	examinationQAInspector1Page,
	QAPanelResponseDatePage
} from '../../../../page-objects/manage/examination/index.ts';

const factCheckUpdates = [
	{ answer: factCheckDateReceivedFromInspector, page: factCheckDateReceivedFromInspectorPage },
	{ answer: factCheckDueDate, page: factCheckDueDatePage },
	{ answer: factCheckActualDate, page: factCheckActualDatePage },
	{ answer: factCheckReceivedBackFromLpaDate, page: factCheckReceivedBackFromLpaDatePage },
	{ answer: finalReportIssueDate, page: finalReportIssueDatePage }
];

describe('Examination updates', () => {
	beforeEach(() => {
		cy.task('clearDb');
		openSeededExaminationPage();
	});

	after(() => cy.task('clearDb'));

	it('updates a Letter date and records case history', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(letterSentToMHCLGDate.row);

		letterSentToMHCLGDatePage.verifyLoaded(letterSentToMHCLGDate.input);
		letterSentToMHCLGDatePage.enterDate(letterSentToMHCLGDate.updatedInput);

		examinationPage.verifyLoaded('Cypress Test Plan');
		examinationPage.verifySummaryRowContains(letterSentToMHCLGDate.row, letterSentToMHCLGDate.updatedDisplay);

		examinationPage.openServiceNavigationItem('Case History');
		caseHistoryPage.verifyLoaded();
		caseHistoryPage.verifyHistoryEvent(`Letter sent to MHCLG date updated to ${letterSentToMHCLGDate.updatedDisplay}`);
	});

	it('returns to Examination from a Letter date page back link', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(letterSentToMHCLGDate.row);
		letterSentToMHCLGDatePage.verifyLoaded(letterSentToMHCLGDate.input);
		letterSentToMHCLGDatePage.goBack();

		examinationPage.verifyLoaded('Cypress Test Plan');
		examinationPage.verifySummaryRowContains(letterSentToMHCLGDate.row, letterSentToMHCLGDate.display);
	});

	it('updates Fact Check dates and records case history', { tags: ['regression'] }, () => {
		factCheckUpdates.forEach(({ answer, page }) => {
			examinationPage.openActionLinkFor(answer.row);

			page.verifyLoaded(answer.input);
			page.enterDate(answer.updatedInput);

			examinationPage.verifyLoaded('Cypress Test Plan');
			examinationPage.verifySummaryRowContains(answer.row, answer.updatedDisplay);
		});

		examinationPage.openServiceNavigationItem('Case History');
		caseHistoryPage.verifyLoaded();

		factCheckUpdates.forEach(({ answer }) => {
			caseHistoryPage.verifyHistoryEvent(`${answer.row} updated to ${answer.updatedDisplay}`);
		});
	});

	it('returns to Examination from a Fact Check date page back link', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(factCheckDateReceivedFromInspector.row);
		factCheckDateReceivedFromInspectorPage.verifyLoaded(factCheckDateReceivedFromInspector.input);
		factCheckDateReceivedFromInspectorPage.goBack();

		examinationPage.verifyLoaded('Cypress Test Plan');
		examinationPage.verifySummaryRowContains(
			factCheckDateReceivedFromInspector.row,
			factCheckDateReceivedFromInspector.display
		);
	});

	it('updates QA Inspector 1 question and records case history', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(QAInspectorsAnswers.QAInspector1.row);

		examinationQAInspector1Page.verifyLoaded();
		examinationQAInspector1Page.enterLookupAnswer(QAInspectorsAnswers.QAInspector1.updatedInput);

		examinationPage.verifyLoaded('Cypress Test Plan');
		examinationPage.verifySummaryRowContains(
			QAInspectorsAnswers.QAInspector1.row,
			QAInspectorsAnswers.QAInspector1.updatedDisplay
		);

		examinationPage.openServiceNavigationItem('Case History');
		caseHistoryPage.verifyLoaded();
		caseHistoryPage.verifyHistoryEvent('QA Inspector 1 updated to inspector-2');
	});

	it(
		'updates QA panel response sent to Inspector Date question and records case history',
		{ tags: ['regression'] },
		() => {
			examinationPage.openActionLinkFor(QADateAnswers.QAPanelResponseDate.row);

			QAPanelResponseDatePage.verifyLoaded(QADateAnswers.QAPanelResponseDate.input);
			QAPanelResponseDatePage.enterDate(QADateAnswers.QAPanelResponseDate.updatedInput);

			examinationPage.verifyLoaded('Cypress Test Plan');
			examinationPage.verifySummaryRowContains(
				QADateAnswers.QAPanelResponseDate.row,
				QADateAnswers.QAPanelResponseDate.updatedDisplay
			);

			examinationPage.openServiceNavigationItem('Case History');
			caseHistoryPage.verifyLoaded();
			caseHistoryPage.verifyHistoryEvent(
				`QA panel response sent to inspector updated to ${QADateAnswers.QAPanelResponseDate.updatedDisplay}`
			);
		}
	);
});
