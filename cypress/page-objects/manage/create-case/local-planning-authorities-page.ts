import { BasePage } from '../../base-page.ts';
import type { SelectAnswer } from './types.ts';
import { selectLocalPlanningAuthorityPage } from './select-local-planning-authority-page.ts';

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

	addLocalPlanningAuthority(lpa?: SelectAnswer) {
		this.addListItem();

		if (lpa) {
			selectLocalPlanningAuthorityPage.verifyLoaded();
			selectLocalPlanningAuthorityPage.selectLocalPlanningAuthority(lpa);
			this.verifyLoaded();
		}
	}

	changeLocalPlanningAuthority(lpa: SelectAnswer, index = 1) {
		this.changeListItem(index);
		selectLocalPlanningAuthorityPage.verifyLoaded();
		selectLocalPlanningAuthorityPage.selectLocalPlanningAuthority(lpa);
		this.verifyLoaded();
	}

	removeLocalPlanningAuthority(index = 1) {
		this.removeListItem(index);
		this.verifyHeading('Remove local planning authority');
		this.saveAndContinue();
		this.verifyLoaded();
	}

	verifyLocalPlanningAuthorityListed(lpa: SelectAnswer) {
		this.verifySummaryContains(lpa.value);
	}

	verifyLocalPlanningAuthorityNotListed(lpa: SelectAnswer) {
		this.verifySummaryDoesNotContain(lpa.value);
	}
}

export const localPlanningAuthoritiesPage = new LocalPlanningAuthoritiesPage();
