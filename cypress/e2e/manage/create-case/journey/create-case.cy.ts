import {
	caseOfficerPage,
	caseCreatedPage,
	checkYourAnswersPage,
	contactDetailsListPage,
	keyStageDatesPage,
	localPlanningAuthoritiesPage,
	planTitlePage,
	planTypePage,
	type CreateCaseData
} from '../../../../page-objects/manage/create-case/index.ts';
import { completeCreateCaseFlow } from '../../../../flows/manage/create-case-flow.ts';
import { manageHomePage } from '../../../../page-objects/manage/home-page.ts';

const loadCreateCaseData = () => cy.fixture<CreateCaseData>('manage/create-case.json');

const openChangeLinkFromCheckYourAnswers = (data: CreateCaseData, rowName: string) => {
	completeCreateCaseFlow(data);
	checkYourAnswersPage.verifyLoaded();
	checkYourAnswersPage.openChangeLinkFor(rowName);
};

describe('Create a case', () => {
	after(() => cy.task('clearDb'));

	it('creates a case through the full journey', { tags: ['smoke', 'regression'] }, () => {
		loadCreateCaseData().then((data) => {
			completeCreateCaseFlow(data);

			checkYourAnswersPage.verifyLoaded();
			checkYourAnswersPage.verifyAnswers(data);
			checkYourAnswersPage.verifyChangeLinksNavigateToExpectedPages(data);
			checkYourAnswersPage.openChangeLinkFor('Dates');
			keyStageDatesPage.verifyLoaded();
			keyStageDatesPage.verifyKeyStageDatesPopulated(data.dates);
			cy.go('back');
			checkYourAnswersPage.verifyLoaded();
			checkYourAnswersPage.submitCase();
			caseCreatedPage.verifyLoaded();
			caseCreatedPage.verifyReferenceFormat();
		});
	});

	it('starts a new create case journey after submitting a case', { tags: ['regression'] }, () => {
		loadCreateCaseData().then((data) => {
			completeCreateCaseFlow(data);

			checkYourAnswersPage.verifyLoaded();
			checkYourAnswersPage.submitCase();
			caseCreatedPage.verifyLoaded();

			manageHomePage.visit();
			manageHomePage.startCreateCase();
			caseOfficerPage.verifyLoaded();
			caseOfficerPage.selectCaseOfficer(data.caseOfficer.value);

			planTitlePage.verifyLoaded();
		});
	});

	it(
		'allows Local Planning Authorities opened from check your answers to add another item',
		{ tags: ['regression'] },
		() => {
			loadCreateCaseData().then((data) => {
				const rowName = 'Local Planning Authorities';
				const addedLpa = {
					value: 'Local Planning Authority 3',
					label: 'lpaContact-3'
				};

				openChangeLinkFromCheckYourAnswers(data, rowName);
				localPlanningAuthoritiesPage.verifyLoaded();
				localPlanningAuthoritiesPage.addLocalPlanningAuthority(addedLpa);
				localPlanningAuthoritiesPage.verifyLocalPlanningAuthorityListed(addedLpa);
				localPlanningAuthoritiesPage.saveAndContinue();
				checkYourAnswersPage.verifyLoaded();
				checkYourAnswersPage.verifySummaryRowContains(rowName, addedLpa.value);
			});
		}
	);

	it('allows contact details opened from check your answers to add another item', { tags: ['regression'] }, () => {
		loadCreateCaseData().then((data) => {
			const rowName = 'Contact details';
			const addedContact: CreateCaseData['contact'] = {
				...data.contact,
				firstName: 'Additional',
				lastName: 'Contact',
				email: 'additional.contact@example.com',
				phone: '02079460003'
			};

			openChangeLinkFromCheckYourAnswers(data, rowName);
			contactDetailsListPage.verifyLoaded();
			contactDetailsListPage.addContact(addedContact);
			contactDetailsListPage.verifyContactListed(addedContact);
			contactDetailsListPage.saveAndContinue();
			checkYourAnswersPage.verifyLoaded();
			checkYourAnswersPage.verifySummaryRowContains(
				rowName,
				addedContact.firstName,
				addedContact.lastName,
				addedContact.email,
				addedContact.phone
			);
		});
	});

	it('Iterates back through create-a-case flow using back button', { tags: ['regression'] }, () => {
		loadCreateCaseData().then((data) => {
			completeCreateCaseFlow(data);

			checkYourAnswersPage.verifyLoaded();
			checkYourAnswersPage.goBack();

			keyStageDatesPage.verifyLoaded();
			keyStageDatesPage.verifyKeyStageDatesPopulated(data.dates);
			keyStageDatesPage.goBack();

			contactDetailsListPage.verifyLoaded();
			contactDetailsListPage.verifyContactListed(data.contact);
			contactDetailsListPage.goBack();

			localPlanningAuthoritiesPage.verifyLoaded();
			localPlanningAuthoritiesPage.verifyLocalPlanningAuthoritiesListed(data);
			localPlanningAuthoritiesPage.goBack();

			planTypePage.verifyLoaded();
			planTypePage.verifyPlanTypeSelected(data.planType.value);
			planTypePage.goBack();

			planTitlePage.verifyLoaded();
			planTitlePage.verifyTitleFilled(data.planTitle);
			planTitlePage.goBack();

			caseOfficerPage.verifyLoaded();
			caseOfficerPage.verifyCaseOfficerSelected(data.caseOfficer.value);
			caseOfficerPage.goBack();
			manageHomePage.verifyLoaded();
		});
	});
});
