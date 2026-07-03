import { LocalPlanningAuthoritiesBasePage } from '../base/index.ts';
import { caseOverviewSelectLocalPlanningAuthorityPage } from './select-local-planning-authority-page.ts';

export class CaseOverviewLocalPlanningAuthoritiesPage extends LocalPlanningAuthoritiesBasePage {
	constructor() {
		super(caseOverviewSelectLocalPlanningAuthorityPage, /^\/case\/.+\/overview\/case-details\/check-lpas$/);
	}

	protected verifyAfterLocalPlanningAuthoritySave() {
		this.verifyPath(/^\/case\/.+\/overview$/);
	}
}

export const caseOverviewLocalPlanningAuthoritiesPage = new CaseOverviewLocalPlanningAuthoritiesPage();
