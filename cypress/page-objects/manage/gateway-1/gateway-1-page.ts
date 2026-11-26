import { GatewayBasePage } from '../base/gateway-page.ts';
import {
	gateway1DateAnswers,
	gateway1DsaAnswer,
	gateway1ExpectedAnswers,
	signedSLA
} from '../../../fixtures/manage/gateway-1.ts';

const filePath = 'cypress/downloads/';

const gateway1Rows = [...Object.values(gateway1DateAnswers).map(({ row }) => row), gateway1DsaAnswer.row];

const actionLinkHrefs: Array<[string, RegExp]> = [
	...Object.values(gateway1DateAnswers).map(({ row, path }): [string, RegExp] => [
		row,
		new RegExp(`^/case/.+/gateway-1/gateway-1/${path}$`)
	]),
	[gateway1DsaAnswer.row, new RegExp(`^/case/.+/gateway-1/gateway-1/${gateway1DsaAnswer.path}$`)]
];

export class Gateway1Page extends GatewayBasePage {
	constructor() {
		super(/^\/case\/.+\/gateway-1$/);
	}

	verifyExpectedRows() {
		gateway1Rows.forEach((key) => {
			this.summaryRow(key).should('be.visible');
		});
	}

	verifyExpectedSeededAnswers() {
		gateway1ExpectedAnswers.forEach(({ row, display }) => {
			this.verifySummaryRowContains(row, display);
		});
	}

	verifyExpectedActionLinkHrefs() {
		actionLinkHrefs.forEach(([key, href]) => {
			this.verifySummaryRowActionHref(key, href);
		});
	}

	verifySummaryRowContainsFileLink(row: string, fileName: string) {
		super.verifySummaryRowContains(row, fileName);
		super.verifySummaryRowValueLinkHref(row, /case\/.+\/download-case-document\/.+$/);
		this.summaryRowValue(row).find('a').click();
		cy.readFile(`${filePath}${fileName}`).should('exist');
	}

	verifySignedSlaAwaitingScan(fileName: string) {
		this.verifyVirusScanInProgressBanner();
		this.summaryRowValue(signedSLA.row).contains('.govuk-tag--yellow', 'Virus scanning').should('be.visible');
		this.summaryRowValue(signedSLA.row).contains('a', fileName).should('be.visible').and('not.have.attr', 'href');
	}

	verifySignedSlaScanned(fileName: string) {
		this.virusScanInProgressBanner.should('not.exist');
		this.summaryRowValue(signedSLA.row).should('not.contain.text', 'Virus scanning');
		this.verifySummaryRowContainsFileLink(signedSLA.row, fileName);
	}
}

export const gateway1Page = new Gateway1Page();
