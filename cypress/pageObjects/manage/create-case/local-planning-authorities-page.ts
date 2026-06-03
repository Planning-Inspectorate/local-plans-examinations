import { BasePage } from '../../base-page.ts';
import type { SelectAnswer } from './types.ts';

export class LocalPlanningAuthoritiesPage extends BasePage {
	constructor() {
		super('/create-a-case/case-details/check-lpas');
	}

	verifyLoaded() {
		this.verifyPath();
		this.verifyHeading('Local Planning Authorities');
		this.addListItemButton.should('be.visible');
		this.verifySaveAndContinueVisible();
	}

	addLocalPlanningAuthority() {
		this.addListItem();
	}

	verifyLocalPlanningAuthorityListed(lpa: SelectAnswer) {
		this.verifySummaryContains(lpa.label);
	}
}

export const localPlanningAuthoritiesPage = new LocalPlanningAuthoritiesPage();
