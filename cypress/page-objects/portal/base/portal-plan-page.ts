import { BasePage } from '../../../page-objects/base-page.ts';

export class PortalPlanBasePage extends BasePage {
	pathFor(planReference: string): string {
		throw new Error(`${this.constructor.name} does not define pathFor for ${planReference}`);
	}

	visit(planReference: string) {
		cy.visit(this.pathFor(planReference));
	}

	verifyPathForPlan(planReference: string) {
		this.verifyPath(this.pathFor(planReference));
	}
}
