import {
	localPlanningAuthoritiesPage,
	selectLocalPlanningAuthorityPage
} from '../../../../pageObjects/manage/create-case/index.ts';

describe('Create a case - Local Planning Authorities', () => {
	it('requires at least one Local Planning Authority before continuing', { tags: ['regression'] }, () => {
		localPlanningAuthoritiesPage.visitAndSubmitForValidation('You must add at least one Local Planning Authority');
	});

	it('shows validation when no Local Planning Authority is selected', { tags: ['regression'] }, () => {
		selectLocalPlanningAuthorityPage.visitForNewItemAndSubmitForValidation('Select a Local Planning Authority');
	});
});
