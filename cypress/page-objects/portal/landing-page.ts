import { PortalPlanBasePage } from './base/portal-plan-page.ts';
export class PortalLandingPage extends PortalPlanBasePage {
	constructor() {
		super('/manage-local-plans/your-plans');
	}
}

export const portalLandingPage = new PortalLandingPage();
