import { BasePage } from '../../base-page.ts';

export class Gateway2ApplicationPage extends BasePage {
	pathFor(planReference: string) {
		return `/manage-local-plans/${planReference}/gateway-2-application`;
	}

	verifyPathForPlan(planReference: string) {
		this.verifyPath(this.pathFor(planReference));
	}
}

export const gateway2ApplicationPage = new Gateway2ApplicationPage();
