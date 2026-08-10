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
	caseOverviewQAInspector1Page
} from '../../../../page-objects/manage/case-overview/index.ts';
import { manageHomePage } from '../../../../page-objects/manage/home-page.ts';

const openSeededCase = () => {
	cy.task('seedDb');

	manageHomePage.visit();
	manageHomePage.openCaseByPlanTitle('Cypress Test Plan');
	caseOverviewPage.verifyLoaded('Cypress Test Plan');
};

describe('Case overview updates', () => {
	beforeEach(() => {
		cy.task('clearDb');
		openSeededCase();
	});

	after(() => cy.task('clearDb'));

	it('updates the plan title from the overview change link', { tags: ['regression'] }, () => {
		const updatedPlanTitle = 'Updated Cypress Test Plan';

		caseOverviewPage.openActionLinkFor('Plan title');
		caseOverviewPlanTitlePage.verifyLoaded('Cypress Test Plan');
		caseOverviewPlanTitlePage.enterPlanTitle(updatedPlanTitle);

		caseOverviewPage.verifyLoaded(updatedPlanTitle);
		caseOverviewPage.verifySummaryRowContains('Plan title', updatedPlanTitle);
	});

	it('updates the plan type from the overview change link', { tags: ['regression'] }, () => {
		caseOverviewPage.openActionLinkFor('Plan type');
		caseOverviewPlanTypePage.verifyLoaded();
		caseOverviewPlanTypePage.selectPlanType('other');

		caseOverviewPage.verifyLoaded('Cypress Test Plan');
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

		caseOverviewPage.verifyLoaded('Cypress Test Plan');
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

			caseOverviewPage.verifyLoaded('Cypress Test Plan');
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

		caseOverviewPage.openActionLinkFor('Assessor Gateway 2');
		caseOverviewGateway2AssessorPage.verifyLoaded();
		caseOverviewGateway2AssessorPage.goBack();

		caseOverviewPage.openActionLinkFor('Examining Inspector 1');
		caseOverviewExaminingInspector1Page.verifyLoaded();
		caseOverviewExaminingInspector1Page.goBack();

		caseOverviewPage.openActionLinkFor('QA Inspector 1');
		caseOverviewQAInspector1Page.verifyLoaded();
		caseOverviewQAInspector1Page.goBack();

		caseOverviewPage.verifyLoaded('Cypress Test Plan');
	});

	it(
		'answers an empty overview question (Examination website) and checks the hyperlink created',
		{ tags: ['regression'] },
		() => {
			const examinationWebsiteLink = 'https://www.gov.uk/';

			caseOverviewPage.openActionLinkFor('Examination website');

			caseOverviewExaminationWebsitePage.verifyLoaded();
			caseOverviewExaminationWebsitePage.enterExaminationWebsiteLink(examinationWebsiteLink);

			caseOverviewPage.verifyLoaded('Cypress Test Plan');
			caseOverviewPage.verifySummaryRowContains('Examination website', examinationWebsiteLink);
			caseOverviewPage.verifyExaminationWebsiteHyperlink(examinationWebsiteLink);
		}
	);

	it('updates the Gateway 2 assessor name answer', { tags: ['regression'] }, () => {
		caseOverviewPage.openActionLinkFor('Assessor Gateway 2');

		caseOverviewGateway2AssessorPage.verifyLoaded();
		caseOverviewGateway2AssessorPage.enterAssessorName('Assessor 1');

		caseOverviewPage.verifyLoaded('Cypress Test Plan');
		caseOverviewPage.verifySummaryRowContains('Assessor Gateway 2', 'Assessor 1');
	});

	it('updates the Examining inspector 1 name answer', { tags: ['regression'] }, () => {
		caseOverviewPage.openActionLinkFor('Examining Inspector 1');

		caseOverviewExaminingInspector1Page.verifyLoaded();
		caseOverviewExaminingInspector1Page.enterInspectorName('Inspector 1');

		caseOverviewPage.verifyLoaded('Cypress Test Plan');
		caseOverviewPage.verifySummaryRowContains('Examining Inspector 1', 'Inspector 1');
	});

	it('updates the QA inspector 1 name answer', { tags: ['regression'] }, () => {
		caseOverviewPage.openActionLinkFor('QA Inspector 1');

		caseOverviewQAInspector1Page.verifyLoaded();
		caseOverviewQAInspector1Page.enterQAInspectorName('Inspector 1');

		caseOverviewPage.verifyLoaded('Cypress Test Plan');
		caseOverviewPage.verifySummaryRowContains('QA Inspector 1', 'Inspector 1');
	});
});
