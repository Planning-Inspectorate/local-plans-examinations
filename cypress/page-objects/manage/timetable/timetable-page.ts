import { GatewayBasePage } from '../base/gateway-page.ts';
import { DateQuestionPage } from '../base/date-question-page.ts';
import { timetableSections } from '../../../fixtures/manage/timetable.ts';
import { gateway2DateAnswers } from '../../../fixtures/manage/gateway-2.ts';

class TimetablePage extends GatewayBasePage {
	constructor() {
		super(/^\/case\/.+\/timetable$/);
	}

	sectionSummary(heading: string) {
		return cy.contains('h2', new RegExp(`^${heading}$`)).next('dl');
	}

	verifyContent(reference: string, planTitle: string) {
		this.verifyLoaded(planTitle);
		this.verifyCaptionL(reference);
		this.verifyBackLink('/');
		this.verifyServiceNavigation(
			'Overview',
			'Timetable',
			'Gateway 1',
			'Gateway 2',
			'Gateway 3',
			'Examination',
			'Case History'
		);
		Object.entries(timetableSections).forEach(([heading, rows]) => {
			this.verifySectionHeading(heading);
			this.sectionSummary(heading).within(() => {
				rows.forEach(({ row, display, path }) => {
					this.verifySummaryRowContains(row, ...[display].flat());
					if (path) this.verifySummaryRowActionHref(row, `/case/${reference}/${path}`);
				});
			});
		});
	}

	verifySectionAnswer(heading: string, row: string, value: string) {
		this.verifyLoaded();
		this.sectionSummary(heading).within(() => this.verifySummaryRowContains(row, value));
	}

	openSectionAction(heading: string, row: string) {
		this.verifyLoaded();
		this.sectionSummary(heading).within(() => this.openActionLinkFor(row));
	}
}

export const timetablePage = new TimetablePage();
export const timetableGateway2ExpectedDatePage = new DateQuestionPage(
	new RegExp(`^/case/.+/timetable/gateway-2/${gateway2DateAnswers.gateway2ExpectedDate.path}$`),
	gateway2DateAnswers.gateway2ExpectedDate.fieldName,
	gateway2DateAnswers.gateway2ExpectedDate.heading
);
