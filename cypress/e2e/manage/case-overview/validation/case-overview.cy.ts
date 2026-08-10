import {
	caseOverviewPage,
	caseOverviewExaminingInspector3Page,
	caseOverviewGateway3AssessorPage,
	caseOverviewQAInspector3Page
} from '../../../../page-objects/manage/case-overview/index.ts';
import { manageHomePage } from '../../../../page-objects/manage/home-page.ts';

const openSeededCase = () => {
	cy.task('seedDb');

	manageHomePage.visit();
	manageHomePage.openCaseByPlanTitle('Cypress Test Plan');
	caseOverviewPage.verifyLoaded('Cypress Test Plan');
};

describe('Case overview validation', () => {
	beforeEach(() => {
		cy.task('clearDb');
		openSeededCase();
	});

	after(() => cy.task('clearDb'));

	it('shows an error for Assessor Gateway 3 Page', { tags: ['regression'] }, () => {
		caseOverviewPage.openActionLinkFor('Assessor Gateway 3');
		caseOverviewGateway3AssessorPage.verifyLoaded();
		caseOverviewGateway3AssessorPage.assessorInputID.clearAndWrite('');
		caseOverviewGateway3AssessorPage.saveAndContinue();

		caseOverviewGateway3AssessorPage.verifyLoaded();
		caseOverviewGateway3AssessorPage.verifyValidationErrors('Input Assessor Gateway 3');
	});

	it('shows an error for Examining Inspector 3 Page', { tags: ['regression'] }, () => {
		caseOverviewPage.openActionLinkFor('Examining Inspector 3');
		caseOverviewExaminingInspector3Page.verifyLoaded();
		caseOverviewExaminingInspector3Page.examiningInspectorInputID.clearAndWrite('');
		caseOverviewExaminingInspector3Page.saveAndContinue();

		caseOverviewExaminingInspector3Page.verifyLoaded();
		caseOverviewExaminingInspector3Page.verifyValidationErrors('Input Examining Inspector 3');
	});

	it('shows an error for QA Inspector 3 Page', { tags: ['regression'] }, () => {
		caseOverviewPage.openActionLinkFor('QA Inspector 3');
		caseOverviewQAInspector3Page.verifyLoaded();
		caseOverviewQAInspector3Page.qaInspectorNameInputID.clearAndWrite('');
		caseOverviewQAInspector3Page.saveAndContinue();

		caseOverviewQAInspector3Page.verifyLoaded();
		caseOverviewQAInspector3Page.verifyValidationErrors('Input QA Inspector 3');
	});
});
