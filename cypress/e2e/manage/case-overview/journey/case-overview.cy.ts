import {
	caseOverviewContactDetailsListPage,
	caseOverviewExaminationWebsitePage,
	caseOverviewPage,
	caseOverviewPlanBandPage,
	caseOverviewPlanTitlePage,
	caseOverviewPlanTypePage,
	caseOverviewProgrammeOfficerPage,
	caseOverviewGateway2AssessorPage,
	caseOverviewExaminingInspector1Page,
	caseOverviewQAInspector1Page,
	deleteCasePage
} from '../../../../page-objects/manage/case-overview/index.ts';
import { seededCase } from '../../../../fixtures/manage/case.ts';
import { manageHomePage } from '../../../../page-objects/manage/home-page.ts';

const planTitle = seededCase.planTitle;

const openSeededCase = () => {
	cy.task('seedDb');

	manageHomePage.visit();
	manageHomePage.openCaseByPlanTitle(planTitle);
	caseOverviewPage.verifyLoaded(planTitle);
};

describe('Case overview updates', () => {
	beforeEach(() => {
		cy.task('clearDb');
		openSeededCase();
	});

	after(() => cy.task('clearDb'));

	it('updates the plan title from the overview change link', { tags: ['regression'] }, () => {
		const updatedPlanTitle = `Updated ${planTitle}`;

		caseOverviewPage.openActionLinkFor('Plan title');
		caseOverviewPlanTitlePage.verifyLoaded(planTitle);
		caseOverviewPlanTitlePage.enterPlanTitle(updatedPlanTitle);

		caseOverviewPage.verifyLoaded(updatedPlanTitle);
		caseOverviewPage.verifySummaryRowContains('Plan title', updatedPlanTitle);
	});

	it('updates the plan type from the overview change link', { tags: ['regression'] }, () => {
		caseOverviewPage.openActionLinkFor('Plan type');
		caseOverviewPlanTypePage.verifyLoaded();
		caseOverviewPlanTypePage.selectPlanType('other');

		caseOverviewPage.verifyLoaded(planTitle);
		caseOverviewPage.verifySummaryRowContains('Plan type', 'Other');
	});

	it('updates contact details from the overview change link', { tags: ['regression'] }, () => {
		const updatedContact = {
			firstName: 'Updated',
			lastName: 'Contact',
			email: 'updated.contact@example.com',
			phone: '02079460001'
		};

		caseOverviewPage.openActionLinkFor('Contact details');
		caseOverviewContactDetailsListPage.verifyLoaded();
		caseOverviewContactDetailsListPage.changeContact(updatedContact);

		caseOverviewPage.verifyLoaded(planTitle);
		caseOverviewPage.verifySummaryRowContains(
			'Contact details',
			updatedContact.firstName,
			updatedContact.lastName,
			updatedContact.email,
			updatedContact.phone
		);
	});

	it(
		'answers an empty overview question (Programme Officer) and updates the overview row',
		{ tags: ['regression'] },
		() => {
			const programmeOfficerFirstName = 'Programme';
			const programmeOfficerLastName = 'Officer 1';
			const programmeOfficerEmail = 'programme.officer1@example.com';

			caseOverviewPage.verifySummaryRowContains('Programme Officer', 'Not started');
			caseOverviewPage.openActionLinkFor('Programme Officer');
			caseOverviewProgrammeOfficerPage.verifyLoaded();
			caseOverviewProgrammeOfficerPage.enterProgrammeOfficerDetails(
				programmeOfficerFirstName,
				programmeOfficerLastName,
				programmeOfficerEmail
			);

			caseOverviewPage.verifyLoaded(planTitle);
			caseOverviewPage.verifySummaryRowContains(
				'Programme Officer',
				programmeOfficerFirstName,
				programmeOfficerLastName,
				programmeOfficerEmail
			);
		}
	);

	it('returns to overview from the back links', { tags: ['regression', 'smoke'] }, () => {
		caseOverviewPage.openActionLinkFor('Plan band');
		caseOverviewPlanBandPage.verifyLoaded();
		caseOverviewPlanBandPage.goBack();
		caseOverviewPage.verifyLoaded(planTitle);

		caseOverviewPage.openActionLinkFor('Assessor Gateway 2');
		caseOverviewGateway2AssessorPage.verifyLoaded();
		caseOverviewGateway2AssessorPage.goBack();
		caseOverviewPage.verifyLoaded(planTitle);

		caseOverviewPage.openActionLinkFor('Examining Inspector 1');
		caseOverviewExaminingInspector1Page.verifyLoaded();
		caseOverviewExaminingInspector1Page.goBack();
		caseOverviewPage.verifyLoaded(planTitle);

		caseOverviewPage.openActionLinkFor('QA Inspector 1');
		caseOverviewQAInspector1Page.verifyLoaded();
		caseOverviewQAInspector1Page.goBack();

		caseOverviewPage.verifyLoaded(planTitle);
	});

	it(
		'answers an empty overview question (Examination website) and checks the hyperlink created',
		{ tags: ['regression'] },
		() => {
			const examinationWebsiteLink = 'https://www.gov.uk/';

			caseOverviewPage.openActionLinkFor('Examination website');

			caseOverviewExaminationWebsitePage.verifyLoaded();
			caseOverviewExaminationWebsitePage.enterExaminationWebsiteLink(examinationWebsiteLink);

			caseOverviewPage.verifyLoaded(planTitle);
			caseOverviewPage.verifySummaryRowContains('Examination website', examinationWebsiteLink);
			caseOverviewPage.verifyExaminationWebsiteHyperlink(examinationWebsiteLink);
		}
	);

	it('updates the Gateway 2 assessor name answer', { tags: ['regression'] }, () => {
		caseOverviewPage.openActionLinkFor('Assessor Gateway 2');

		caseOverviewGateway2AssessorPage.verifyLoaded();
		caseOverviewGateway2AssessorPage.enterLookupAnswer('Assessor 1');

		caseOverviewPage.verifyLoaded(planTitle);
		caseOverviewPage.verifySummaryRowContains('Assessor Gateway 2', 'Assessor 1');
	});

	it('updates the Examining inspector 1 name answer', { tags: ['regression'] }, () => {
		caseOverviewPage.openActionLinkFor('Examining Inspector 1');

		caseOverviewExaminingInspector1Page.verifyLoaded();
		caseOverviewExaminingInspector1Page.enterLookupAnswer('Inspector 1');

		caseOverviewPage.verifyLoaded(planTitle);
		caseOverviewPage.verifySummaryRowContains('Examining Inspector 1', 'Inspector 1');
	});

	it('updates the QA inspector 1 name answer', { tags: ['regression'] }, () => {
		caseOverviewPage.openActionLinkFor('QA Inspector 1');

		caseOverviewQAInspector1Page.verifyLoaded();
		caseOverviewQAInspector1Page.enterLookupAnswer('Inspector 1');

		caseOverviewPage.verifyLoaded(planTitle);
		caseOverviewPage.verifySummaryRowContains('QA Inspector 1', 'Inspector 1');
	});

	it('deletes a case from the case overview', { tags: ['regression'] }, () => {
		caseOverviewPage.navigateToDeletePage();

		deleteCasePage.verifyLoaded();
		deleteCasePage.verifyCaseDetails(
			planTitle,
			'Local Plan',
			'Local Planning Authority 1, Local Planning Authority 2',
			'Case Officer 1'
		);
		deleteCasePage.deleteCase();
		manageHomePage.verifyNoCasesMessage('No cases have been created yet.');
	});
});
