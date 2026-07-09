import { SelectLocalPlanningAuthorityBasePage } from '../base/index.ts';

const defaultNewItemId = 'cypress-lpa';

export class SelectLocalPlanningAuthorityPage extends SelectLocalPlanningAuthorityBasePage {
	constructor() {
		super(/^\/create-a-case\/case-details\/check-lpas\/(add|edit)\/[^/]+\/select-lpa$/);
	}

	visitForNewItem(itemId = defaultNewItemId) {
		this.visit(`/create-a-case/case-details/check-lpas/add/${itemId}/select-lpa`);
	}

	visitForNewItemAndSubmitForValidation(...messages: string[]) {
		this.visitForNewItem();
		this.verifyLoaded();
		this.submitAndVerifyValidationErrors(...messages);
	}
}

export const selectLocalPlanningAuthorityPage = new SelectLocalPlanningAuthorityPage();
