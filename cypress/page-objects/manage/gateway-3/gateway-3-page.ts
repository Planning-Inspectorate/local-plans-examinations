import { GatewayBasePage } from '../base/gateway-page.ts';
import {
	gateway3DateAnswers,
	gateway3AssessorAnswer,
	gateway3ProgrammeOfficerAnswer,
	gateway3ExpectedAnswers,
	gateway3ExaminationWebsite,
	gateway3DocumentsAnswer,
	gateway3DecisionAnswer,
	gateway3ReviewDocumentsAnswer
} from '../../../fixtures/manage/gateway-3.ts';

const gateway3Rows = [
	...Object.values(gateway3DateAnswers).map(({ row }) => row),
	gateway3AssessorAnswer.row,
	gateway3ProgrammeOfficerAnswer.row,
	gateway3ExaminationWebsite.row,
	gateway3ReviewDocumentsAnswer.row,
	gateway3DecisionAnswer.row
];

const reviewDocumentsHref = new RegExp(
	`^/case/.+/gateway-3/gateway-3-submission-(\\d+)/${gateway3ReviewDocumentsAnswer.path}-(\\d+)$`
);

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
	[
		gateway3ReviewDocumentsAnswer.row,
		new RegExp(`^/case/.+/gateway-3/gateway-3-submission-(\\d+)/${gateway3ReviewDocumentsAnswer.path}-(\\d+)$`)
	],
	[
		gateway3DecisionAnswer.row,
		new RegExp(`^/case/.+/gateway-3/gateway-3-submission-(\\d+)/${gateway3DecisionAnswer.path}-(\\d+)$`)
	]
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

	verifySubmissionDocumentsReviewLink(documentCount: number) {
		this.verifySummaryRowContains(gateway3ReviewDocumentsAnswer.row, `${documentCount} document(s)`);
		this.verifySummaryRowActionHref(gateway3ReviewDocumentsAnswer.row, reviewDocumentsHref);
		this.summaryRowActionLink(gateway3ReviewDocumentsAnswer.row).should(
			'contain.text',
			gateway3ReviewDocumentsAnswer.reviewLinkText
		);
	}

	verifyGateway3SubmissionIssued(decisionText: string) {
		this.verifySummaryRowContains(gateway3DecisionAnswer.row, decisionText);
		this.verifySummaryRowActionHref(
			gateway3DecisionAnswer.row,
			new RegExp(`^/case/.+/gateway-3-report/gateway-3-submission-(\\d+)/${gateway3DocumentsAnswer.path}-(\\d+)/check$`)
		);
		this.summaryRowActionLink(gateway3DecisionAnswer.row).should('contain.text', 'View');
	}
}

export const gateway3Page = new Gateway3Page();
