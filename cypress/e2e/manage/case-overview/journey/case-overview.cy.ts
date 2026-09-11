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
import {
	planTitle,
	planBand,
	planType,
	caseOfficer,
	contactDetails,
	assessorGateway2,
	qaInspector1,
	examinationWebsite,
	examiningInspector1,
	localPlanningAuthority,
	programmeOfficer
} from '../../../../fixtures/manage/overview.ts';
import { seededCase } from '../../../../fixtures/manage/case.ts';
import { manageHomePage } from '../../../../page-objects/manage/home-page.ts';

const seededPlanTitle = seededCase.planTitle;

const lookupUpdateChecks = [
	{
		name: 'Gateway 2 assessor name',
		answer: assessorGateway2,
		page: caseOverviewGateway2AssessorPage
	},
	{
		name: 'Examining inspector 1 name',
		answer: examiningInspector1,
		page: caseOverviewExaminingInspector1Page
	},
	{
		name: 'QA inspector 1 name',
		answer: qaInspector1,
		page: caseOverviewQAInspector1Page
	}
];

const backLinkChecks = [
	{ answer: planBand, page: caseOverviewPlanBandPage },
	{ answer: assessorGateway2, page: caseOverviewGateway2AssessorPage },
	{ answer: examiningInspector1, page: caseOverviewExaminingInspector1Page },
	{ answer: qaInspector1, page: caseOverviewQAInspector1Page }
];

const openSeededCase = () => {
	cy.task('seedDb');

	manageHomePage.visit();
	manageHomePage.openCaseByPlanTitle(seededPlanTitle);
	caseOverviewPage.verifyLoaded(seededPlanTitle);
};

const updateLookupAnswer = ({ answer, page }: (typeof lookupUpdateChecks)[number]) => {
	caseOverviewPage.openActionLinkFor(answer.row);

	page.verifyLoaded();
	page.enterLookupAnswer(answer.value);

	caseOverviewPage.verifyLoaded(seededPlanTitle);
	caseOverviewPage.verifySummaryRowContains(answer.row, answer.value);
};

const returnToOverviewFrom = ({ answer, page }: (typeof backLinkChecks)[number]) => {
	caseOverviewPage.openActionLinkFor(answer.row);
	page.verifyLoaded();
	page.goBack();

	caseOverviewPage.verifyLoaded(seededPlanTitle);
};

describe('Case overview updates', () => {
	beforeEach(() => {
		cy.task('clearDb');
		openSeededCase();
	});

	after(() => cy.task('clearDb'));

	it('updates the plan title from the overview change link', { tags: ['regression'] }, () => {
		caseOverviewPage.openActionLinkFor(planTitle.row);
		caseOverviewPlanTitlePage.verifyLoaded(planTitle.value);
		caseOverviewPlanTitlePage.enterPlanTitle(planTitle.updatedValue);

		caseOverviewPage.verifyLoaded(planTitle.updatedValue);
		caseOverviewPage.verifySummaryRowContains(planTitle.row, planTitle.updatedValue);
	});

	it('updates the plan type from the overview change link', { tags: ['regression'] }, () => {
		caseOverviewPage.openActionLinkFor(planType.row);
		caseOverviewPlanTypePage.verifyLoaded();
		caseOverviewPlanTypePage.selectPlanType(planType.updatedValue);

		caseOverviewPage.verifyLoaded(seededPlanTitle);
		caseOverviewPage.verifySummaryRowContains(planType.row, planType.updatedDisplay);
	});

	it('updates contact details from the overview change link', { tags: ['regression'] }, () => {
		caseOverviewPage.openActionLinkFor(contactDetails.row);
		caseOverviewContactDetailsListPage.verifyLoaded();
		caseOverviewContactDetailsListPage.changeContact(contactDetails.updatedContactDetails);

		caseOverviewPage.verifyLoaded(seededPlanTitle);
		caseOverviewPage.verifySummaryRowContains(
			contactDetails.row,
			contactDetails.updatedContactDetails.email,
			contactDetails.updatedContactDetails.firstName,
			contactDetails.updatedContactDetails.lastName,
			contactDetails.updatedContactDetails.phone
		);
	});

	it('updates the Programme Officer details overview row', { tags: ['regression'] }, () => {
		caseOverviewPage.verifySummaryRowContains(
			programmeOfficer.row,
			programmeOfficer.values.firstName,
			programmeOfficer.values.lastName,
			programmeOfficer.values.email
		);

		caseOverviewPage.openActionLinkFor('Programme Officer details');
		caseOverviewProgrammeOfficerPage.verifyLoaded(
			programmeOfficer.values.firstName,
			programmeOfficer.values.lastName,
			programmeOfficer.values.email
		);

		caseOverviewProgrammeOfficerPage.enterProgrammeOfficerDetails(
			programmeOfficer.updatedValues.firstName,
			programmeOfficer.updatedValues.lastName,
			programmeOfficer.updatedValues.email
		);

		caseOverviewPage.verifyLoaded(seededPlanTitle);
		caseOverviewPage.verifySummaryRowContains(
			programmeOfficer.row,
			programmeOfficer.updatedValues.firstName,
			programmeOfficer.updatedValues.lastName,
			programmeOfficer.updatedValues.email
		);
	});

	it('returns to overview from the back links', { tags: ['regression', 'smoke'] }, () => {
		backLinkChecks.forEach(returnToOverviewFrom);
	});

	it(
		'answers an empty overview question (Examination website) and checks the hyperlink created',
		{ tags: ['regression'] },
		() => {
			caseOverviewPage.openActionLinkFor(examinationWebsite.row);

			caseOverviewExaminationWebsitePage.verifyLoaded();
			caseOverviewExaminationWebsitePage.enterExaminationWebsiteLink(examinationWebsite.value);

			caseOverviewPage.verifyLoaded(seededPlanTitle);
			caseOverviewPage.verifySummaryRowContains(examinationWebsite.row, examinationWebsite.value);
			caseOverviewPage.verifyExaminationWebsiteHyperlink(examinationWebsite.value);
		}
	);

	lookupUpdateChecks.forEach((check) => {
		it(`updates the ${check.name} answer`, { tags: ['regression'] }, () => {
			updateLookupAnswer(check);
		});
	});

	it('deletes a case from the case overview', { tags: ['regression'] }, () => {
		caseOverviewPage.navigateToDeletePage();

		deleteCasePage.verifyLoaded();
		deleteCasePage.verifyCaseDetails(
			seededPlanTitle,
			planType.display,
			`${localPlanningAuthority.lpa1Value}, ${localPlanningAuthority.lpa2Value}`,
			caseOfficer.display
		);
		deleteCasePage.deleteCase();
		manageHomePage.verifyNoCasesMessage('No cases have been created yet.');
	});
});
