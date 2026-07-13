import { BasePage } from '../../base-page.ts';

export class ApplicationCompletePage extends BasePage {
	pathFor(planReference: string) {
		return `/manage-local-plans/${planReference}/gateway-2-application/application-complete`;
	}

	verifyPathForPlan(planReference: string) {
		this.verifyPath(this.pathFor(planReference));
	}
}

export const applicationCompletePage = new ApplicationCompletePage();
