import { BasePage } from '../../base-page.ts';
import type { SelectAnswer } from './types.ts';

const pathPattern = /^\/create-a-case\/case-details\/check-lpas\/add\/[^/]+\/select-lpa$/;
const defaultNewItemId = 'cypress-lpa';

export class SelectLocalPlanningAuthorityPage extends BasePage {
	get localPlanningAuthoritySelect() {
		return cy.get('#lpa');
	}

	visitForNewItem(itemId = defaultNewItemId) {
		this.visit(`/create-a-case/case-details/check-lpas/add/${itemId}/select-lpa`);
	}

	visitForNewItemAndSubmitForValidation(...messages: string[]) {
		this.visitForNewItem();
		this.verifyLoaded();
		this.submitAndVerifyValidationErrors(...messages);
	}

	verifyLoaded() {
		this.verifyPathMatches(pathPattern);
		this.verifyHeading('Select the Local Planning Authority for this plan');
		this.localPlanningAuthoritySelect.should('be.visible');
		this.verifySaveAndContinueVisible();
	}

	selectLocalPlanningAuthority(lpa: SelectAnswer) {
		this.localPlanningAuthoritySelect.should('be.visible').select(lpa.value);
		this.saveAndContinue();
	}
}

export const selectLocalPlanningAuthorityPage = new SelectLocalPlanningAuthorityPage();
