import {
	localPlanningAuthoritiesPage,
	selectLocalPlanningAuthorityPage,
	type CreateCaseData
} from '../../../../pageObjects/manage/create-case/index.ts';

const loadCreateCaseData = () => cy.fixture<CreateCaseData>('manage/create-case.json');

describe('Create a case - Local Planning Authorities', () => {
	it('requires at least one Local Planning Authority before continuing', { tags: ['regression'] }, () => {
		localPlanningAuthoritiesPage.visitAndSubmitForValidation('You must add at least one Local Planning Authority');
	});

	it('shows validation when no Local Planning Authority is selected', { tags: ['regression'] }, () => {
		selectLocalPlanningAuthorityPage.visitForNewItemAndSubmitForValidation('Select a Local Planning Authority');
	});

	it('changes and removes Local Planning Authorities', { tags: ['regression'] }, () => {
		loadCreateCaseData().then((data) => {
			const [firstLpa, secondLpa] = Object.values(data.lpa);
			const updatedLpa = {
				value: 'Local Planning Authority 3',
				label: 'lpaContact-3'
			};

			localPlanningAuthoritiesPage.visit();
			localPlanningAuthoritiesPage.verifyLoaded();
			localPlanningAuthoritiesPage.addLocalPlanningAuthority(firstLpa);
			localPlanningAuthoritiesPage.addLocalPlanningAuthority(secondLpa);
			localPlanningAuthoritiesPage.changeLocalPlanningAuthority(updatedLpa, 2);
			localPlanningAuthoritiesPage.verifyLocalPlanningAuthorityListed(updatedLpa);

			localPlanningAuthoritiesPage.removeLocalPlanningAuthority(2);
			localPlanningAuthoritiesPage.verifyLocalPlanningAuthorityListed(firstLpa);
			localPlanningAuthoritiesPage.verifyLocalPlanningAuthorityNotListed(updatedLpa);
			localPlanningAuthoritiesPage.verifyRemoveListItemHidden();
		});
	});
});
