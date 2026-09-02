import { GatewayBasePage } from '../base/gateway-page.ts';
import {
	gateway3DateAnswers,
	gateway3AssessorAnswer,
	gateway3ProgrammeOfficerAnswer,
	gateway3ExpectedAnswers,
	gateway3ExaminationWebsite,
	gateway3Documents,
	gateway3Decision
} from '../../../fixtures/manage/gateway-3.ts';

const gateway3Rows = [
	...Object.values(gateway3DateAnswers).map(({ row }) => row),
	gateway3AssessorAnswer.row,
	gateway3ProgrammeOfficerAnswer.row,
	gateway3ExaminationWebsite.row,
	gateway3Documents.row,
	gateway3Decision.row
];

const actionLinkHrefs: Array<[string, RegExp]> = [
	...Object.values(gateway3DateAnswers).map(({ row, path, section }): [string, RegExp] => [
		row,
		new RegExp(`^/case/.+/gateway-3/${section}/${path}$`)
	]),
	[gateway3AssessorAnswer.row, new RegExp(`^/case/.+/gateway-3/gateway-3/${gateway3AssessorAnswer.path}$`)],
	[
		gateway3ProgrammeOfficerAnswer.row,
		new RegExp(`^/case/.+/gateway-3/gateway-3/${gateway3ProgrammeOfficerAnswer.path}$`)
	],
	[gateway3ExaminationWebsite.row, new RegExp(`^/case/.+/gateway-3/gateway-3/${gateway3ExaminationWebsite.path}$`)],
	[gateway3Decision.row, new RegExp(`^/case/.+/gateway-3/gateway-3-submission/${gateway3Decision.path}$`)]
];

export class Gateway3Page extends GatewayBasePage {
	constructor() {
		super(/^\/case\/.+\/gateway-3$/);
	}

	verifyExpectedRows() {
		gateway3Rows.forEach((key) => {
			this.summaryRow(key).should('be.visible');
		});
	}

	verifyExpectedSeededAnswers() {
		gateway3ExpectedAnswers.forEach(({ row, display }) => {
			this.verifySummaryRowContains(row, display);
		});
		this.verifySummaryRowContains(
			gateway3ProgrammeOfficerAnswer.row,
			gateway3ProgrammeOfficerAnswer.firstName,
			gateway3ProgrammeOfficerAnswer.lastName,
			gateway3ProgrammeOfficerAnswer.email
		);
	}

	verifyExpectedActionLinkHrefs() {
		actionLinkHrefs.forEach(([key, href]) => {
			this.verifySummaryRowActionHref(key, href);
		});
	}
}

export const gateway3Page = new Gateway3Page();
