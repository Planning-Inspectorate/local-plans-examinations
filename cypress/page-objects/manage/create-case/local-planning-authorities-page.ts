import { LocalPlanningAuthoritiesBasePage } from '../base/index.ts';
import { selectLocalPlanningAuthorityPage } from './select-local-planning-authority-page.ts';

export class LocalPlanningAuthoritiesPage extends LocalPlanningAuthoritiesBasePage {
	constructor() {
		super(selectLocalPlanningAuthorityPage, '/create-a-case/case-details/check-lpas');
	}
}

export const localPlanningAuthoritiesPage = new LocalPlanningAuthoritiesPage();
