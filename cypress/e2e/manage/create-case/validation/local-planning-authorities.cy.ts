import {
	localPlanningAuthoritiesPage,
	selectLocalPlanningAuthorityPage,
	type CreateCaseData
} from '../../../../page-objects/manage/create-case/index.ts';

const loadCreateCaseData = () => cy.fixture<CreateCaseData>('manage/create-case.json');

describe('Create a case - Local Planning Authorities', () => {
	it('requires at least one Local Planning Authority before continuing', { tags: ['regression'] }, () => {
		localPlanningAuthoritiesPage.visitAndSubmitForValidation('You need to add a planning authority');
	});

	it('shows validation when no Local Planning Authority is selected', { tags: ['regression'] }, () => {
		selectLocalPlanningAuthorityPage.visitForNewItemAndSubmitForValidation('You need to select a planning authority');
	});

	it(
		'prevents duplicate Local Planning Authorities while allowing the current one to be edited',
		{ tags: ['regression'] },
		() => {
			loadCreateCaseData().then((data) => {
				const [firstLpa, secondLpa] = Object.values(data.lpa);

				localPlanningAuthoritiesPage.visit();
				localPlanningAuthoritiesPage.verifyLoaded();
				localPlanningAuthoritiesPage.addLocalPlanningAuthority(firstLpa);
				localPlanningAuthoritiesPage.addLocalPlanningAuthority();

				selectLocalPlanningAuthorityPage.verifyLoaded();
				selectLocalPlanningAuthorityPage.verifyLocalPlanningAuthorityOptionDisabled(firstLpa);
				selectLocalPlanningAuthorityPage.verifyLocalPlanningAuthorityOptionEnabled(secondLpa);
				selectLocalPlanningAuthorityPage.selectLocalPlanningAuthority(secondLpa);
				localPlanningAuthoritiesPage.changeListItem(2);

				selectLocalPlanningAuthorityPage.verifyLoaded();
				selectLocalPlanningAuthorityPage.verifyLocalPlanningAuthorityOptionDisabled(firstLpa);
				selectLocalPlanningAuthorityPage.verifyLocalPlanningAuthorityOptionEnabled(secondLpa);
			});
		}
	);

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
