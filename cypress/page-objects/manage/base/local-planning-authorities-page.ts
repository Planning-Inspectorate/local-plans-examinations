import { BasePage } from '../../base-page.ts';
import type { SelectAnswer, SelectLocalPlanningAuthorityBasePage } from './select-local-planning-authority-page.ts';

export class LocalPlanningAuthoritiesBasePage extends BasePage {
	private readonly selectLocalPlanningAuthorityPage: SelectLocalPlanningAuthorityBasePage;

	constructor(selectLocalPlanningAuthorityPage: SelectLocalPlanningAuthorityBasePage, path?: string | RegExp) {
		super(path);
		this.selectLocalPlanningAuthorityPage = selectLocalPlanningAuthorityPage;
	}

	protected verifyAfterLocalPlanningAuthoritySave() {
		this.verifyLoaded();
	}

	verifyLocalPlanningAuthoritiesList() {
		this.verifyHeading('Local Planning Authorities');
		this.addListItemButton.should('be.visible');
		this.verifySaveAndContinueVisible();
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyLocalPlanningAuthoritiesList();
	}

	addLocalPlanningAuthority(lpa?: SelectAnswer) {
		this.addListItem();

		if (lpa) {
			this.selectLocalPlanningAuthorityPage.verifyLoaded();
			this.selectLocalPlanningAuthorityPage.selectLocalPlanningAuthority(lpa);
			this.verifyAfterLocalPlanningAuthoritySave();
		}
	}

	changeLocalPlanningAuthority(lpa: SelectAnswer, index = 1) {
		this.changeListItem(index);
		this.selectLocalPlanningAuthorityPage.verifyLoaded();
		this.selectLocalPlanningAuthorityPage.selectLocalPlanningAuthority(lpa);
		this.verifyAfterLocalPlanningAuthoritySave();
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
