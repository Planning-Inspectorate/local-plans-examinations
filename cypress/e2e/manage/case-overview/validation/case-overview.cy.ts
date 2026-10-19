import { caseOverviewPage, caseOverviewQAInspector3Page } from '../../../../page-objects/manage/case-overview/index.ts';
import { seededCase } from '../../../../fixtures/manage/case.ts';
import { seededCaseNotes } from '../../../../fixtures/manage/overview.ts';
import { manageHomePage } from '../../../../page-objects/manage/home-page.ts';

const planTitle = seededCase.planTitle;

const openSeededCase = () => {
	cy.task('seedDb');

	manageHomePage.visit();
	manageHomePage.openCaseByPlanTitle(planTitle);
	caseOverviewPage.verifyLoaded(planTitle);
};

describe('Case overview validation', () => {
	beforeEach(() => {
		cy.task('clearDb');
		openSeededCase();
	});

	after(() => cy.task('clearDb'));

	[
		{ name: 'empty', note: '', message: 'Please ensure your note contains text' },
		{
			name: 'over 500 characters',
			note: 'a'.repeat(501),
			message: 'Please ensure your note contains up to 500 characters'
		}
	].forEach(({ name, note, message }) => {
		it(`does not save a case note when ${name}`, { tags: ['regression'] }, () => {
			caseOverviewPage.openCaseNotes();
			caseOverviewPage.addCaseNote(note);
			caseOverviewPage.verifyValidationError(message);
			caseOverviewPage.verifyCaseNotes(...seededCaseNotes.map(({ text }) => text));
		});
	});

	it('shows an error for QA Inspector 3 Page', { tags: ['regression'] }, () => {
		caseOverviewPage.openActionLinkFor('QA Inspector 3');

		caseOverviewQAInspector3Page.verifyLoaded();
		caseOverviewQAInspector3Page.clearLookupAnswer();
		caseOverviewQAInspector3Page.submitAndVerifyValidationErrors('Input QA Inspector 3');
	});
});
