import { BasePage } from '../../base-page.ts';
import {
	gateway2DateAnswers,
	workshopVenueAnswer,
	gateway2AssessorAnswer,
	gateway2ExpectedAnswers
} from '../../../fixtures/manage/gateway-2.ts';

const gateway2Rows = [
	...Object.values(gateway2DateAnswers).map(({ row }) => row),
	workshopVenueAnswer.row,
	gateway2AssessorAnswer.row
];

const actionLinkHrefs: Array<[string, RegExp]> = [
	...Object.values(gateway2DateAnswers).map(({ row, path }): [string, RegExp] => [
		row,
		new RegExp(`^/case/.+/gateway-2/gateway-2/${path}$`)
	]),
	[workshopVenueAnswer.row, new RegExp(`^/case/.+/gateway-2/gateway-2/${workshopVenueAnswer.path}$`)],
	[gateway2AssessorAnswer.row, new RegExp(`^/case/.+/gateway-2/gateway-2/${gateway2AssessorAnswer.path}$`)]
];

export class Gateway2Page extends BasePage {
	constructor() {
		super(/^\/case\/.+\/gateway-2$/);
	}

	sectionHeading(text: string) {
		return cy.contains('h2', text);
	}

	openActionLinkFor(key: string) {
		this.summaryRowActionLink(key).should('be.visible').click();
	}

	verifyLoaded(planTitle?: string) {
		super.verifyLoaded();

		if (planTitle) {
			this.verifyHeading(planTitle);
		}
	}

	verifySectionHeading(text: string) {
		this.sectionHeading(text).should('be.visible');
	}

	verifyExpectedRows() {
		gateway2Rows.forEach((key) => {
			this.summaryRow(key).should('be.visible');
		});
	}

	verifyExpectedSeededAnswers() {
		gateway2ExpectedAnswers.forEach(({ row, display }) => {
			this.verifySummaryRowContains(row, display);
		});
	}

	verifyExpectedActionLinkHrefs() {
		actionLinkHrefs.forEach(([key, href]) => {
			this.verifySummaryRowActionHref(key, href);
		});
	}
}

export const gateway2Page = new Gateway2Page();
