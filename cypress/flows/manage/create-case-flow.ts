import {
	caseOfficerPage,
	contactDetailsListPage,
	contactDetailsPage,
	keyStageDatesPage,
	localPlanningAuthoritiesPage,
	planTitlePage,
	planTypePage,
	selectLocalPlanningAuthorityPage,
	type CreateCaseData,
	type SelectAnswer
} from '../../pageObjects/manage/create-case/index.ts';
import { manageHomePage } from '../../pageObjects/manage/home-page.ts';

export const completeCaseDetails = (data: CreateCaseData) => {
	caseOfficerPage.selectCaseOfficer(data.caseOfficer.value);
	planTitlePage.verifyLoaded();
	planTitlePage.enterPlanTitle(data.planTitle);
	planTypePage.verifyLoaded();
	planTypePage.selectPlanType(data.planType.value);
};

export const addLocalPlanningAuthority = (lpa: SelectAnswer) => {
	localPlanningAuthoritiesPage.verifyLoaded();
	localPlanningAuthoritiesPage.addLocalPlanningAuthority();
	selectLocalPlanningAuthorityPage.verifyLoaded();
	selectLocalPlanningAuthorityPage.selectLocalPlanningAuthority(lpa);
	localPlanningAuthoritiesPage.verifyLoaded();
};

export const addContactDetails = (contact: CreateCaseData['contact']) => {
	contactDetailsListPage.verifyLoaded();
	contactDetailsListPage.addContactDetails();
	contactDetailsPage.verifyLoaded();
	contactDetailsPage.enterContactDetails(contact);
	contactDetailsListPage.verifyLoaded();
};

export const completeCreateCaseFlow = (data: CreateCaseData) => {
	manageHomePage.visit();
	manageHomePage.startCreateCase();

	caseOfficerPage.verifyLoaded();
	completeCaseDetails(data);

	for (const lpa of Object.values(data.lpa)) {
		addLocalPlanningAuthority(lpa);
	}

	localPlanningAuthoritiesPage.saveAndContinue();
	addContactDetails(data.contact);
	contactDetailsListPage.saveAndContinue();
	keyStageDatesPage.verifyLoaded();
	keyStageDatesPage.enterKeyStageDates(data.dates);
};
