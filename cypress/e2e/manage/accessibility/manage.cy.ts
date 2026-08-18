import { openSeededExaminationPage } from '../../../flows/manage/examination-flow.ts';
import { seededCase } from '../../../fixtures/manage/case.ts';
import { caseOverviewPage, deleteCasePage } from '../../../page-objects/manage/case-overview/index.ts';
import {
	caseOfficerPage,
	checkYourAnswersPage,
	contactDetailsListPage,
	contactDetailsPage,
	keyStageDatesPage,
	localPlanningAuthoritiesPage,
	planTitlePage,
	planTypePage,
	selectLocalPlanningAuthorityPage,
	type CreateCaseData
} from '../../../page-objects/manage/create-case/index.ts';
import { examinationPage } from '../../../page-objects/manage/examination/index.ts';
import { manageHomePage } from '../../../page-objects/manage/home-page.ts';

const loadCreateCaseData = () => cy.fixture<CreateCaseData>('manage/create-case.json');

const checkPageAccessibility = (verifyLoaded: () => void) => {
	verifyLoaded();
	cy.checkAccessibility();
};

const completeCreateCaseFlowWithAccessibility = (data: CreateCaseData) => {
	const [lpa] = Object.values(data.lpa);

	manageHomePage.visit();
	manageHomePage.startCreateCase();

	checkPageAccessibility(() => caseOfficerPage.verifyLoaded());
	caseOfficerPage.selectCaseOfficer(data.caseOfficer.value);

	checkPageAccessibility(() => planTitlePage.verifyLoaded());
	planTitlePage.enterPlanTitle(data.planTitle);

	checkPageAccessibility(() => planTypePage.verifyLoaded());
	planTypePage.selectPlanType(data.planType.value);

	checkPageAccessibility(() => localPlanningAuthoritiesPage.verifyLoaded());
	localPlanningAuthoritiesPage.addLocalPlanningAuthority();
	checkPageAccessibility(() => selectLocalPlanningAuthorityPage.verifyLoaded());
	selectLocalPlanningAuthorityPage.selectLocalPlanningAuthority(lpa);
	localPlanningAuthoritiesPage.verifyLoaded();

	localPlanningAuthoritiesPage.saveAndContinue();
	contactDetailsListPage.verifyLoaded();
	contactDetailsListPage.addContactDetails();
	checkPageAccessibility(() => contactDetailsPage.verifyLoaded());
	contactDetailsPage.enterContactDetails(data.contact);
	contactDetailsListPage.verifyLoaded();

	contactDetailsListPage.saveAndContinue();
	checkPageAccessibility(() => keyStageDatesPage.verifyLoaded());
	keyStageDatesPage.enterKeyStageDates(data.dates);

	checkPageAccessibility(() => checkYourAnswersPage.verifyLoaded());
};

describe('Manage accessibility', () => {
	beforeEach(() => {
		cy.task('clearDb');
	});

	after(() => cy.task('clearDb'));

	it('checks the home page', { tags: ['accessibility'] }, () => {
		manageHomePage.visit();
		manageHomePage.verifyHeading('All cases');

		cy.checkAccessibility();
	});

	it('checks a form validation error state', { tags: ['accessibility'] }, () => {
		caseOfficerPage.visit();
		caseOfficerPage.verifyLoaded();
		caseOfficerPage.saveAndContinue();
		caseOfficerPage.verifyValidationError('Select a case officer');

		cy.checkAccessibility();
	});

	it('checks the case overview page', { tags: ['accessibility'] }, () => {
		cy.task('seedDb');

		manageHomePage.visit();
		manageHomePage.openCaseByPlanTitle(seededCase.planTitle);
		caseOverviewPage.verifyLoaded(seededCase.planTitle);

		cy.checkAccessibility();
	});

	it('checks the create case journey through Check your answers', { tags: ['accessibility'] }, () => {
		loadCreateCaseData().then((data) => {
			completeCreateCaseFlowWithAccessibility(data);
		});
	});

	it('checks the delete case confirmation page', { tags: ['accessibility'] }, () => {
		cy.task('seedDb');

		manageHomePage.visit();
		manageHomePage.openCaseByPlanTitle(seededCase.planTitle);
		caseOverviewPage.verifyLoaded(seededCase.planTitle);
		caseOverviewPage.navigateToDeletePage();
		deleteCasePage.verifyLoaded();

		cy.checkAccessibility();
	});

	it('checks the Examination page', { tags: ['accessibility'] }, () => {
		openSeededExaminationPage();
		examinationPage.verifySectionHeading('Examination');

		cy.checkAccessibility();
	});
});
