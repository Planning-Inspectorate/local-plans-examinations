import { SelectLocalPlanningAuthorityBasePage } from '../base/index.ts';

export class CaseOverviewSelectLocalPlanningAuthorityPage extends SelectLocalPlanningAuthorityBasePage {
	constructor() {
		super(/^\/case\/.+\/overview\/case-details\/check-lpas\/(add|edit)\/[^/]+\/select-lpa$/);
	}
}

export const caseOverviewSelectLocalPlanningAuthorityPage = new CaseOverviewSelectLocalPlanningAuthorityPage();
