import {
	localPlanningAuthority,
	overviewExpectedAnswers,
	overviewSummaryRows,
	programmeOfficer
} from '../../../fixtures/manage/overview.ts';
import { BasePage } from '../../base-page.ts';

const serviceNavigationItems = [
	'Overview',
	'Timetable',
	'Gateway 1',
	'Gateway 2',
	'Gateway 3',
	'Examination',
	'Case History'
];

const actionLinkHrefs: Array<[string, RegExp]> = [
	['Plan title', /^\/case\/.+\/overview\/case-details\/plan-title$/],
	['Plan type', /^\/case\/.+\/overview\/case-details\/plan-type$/],
	['Local Planning Authority', /^\/case\/.+\/overview\/case-details\/check-lpas$/],
	['Case officer', /^\/case\/.+\/overview\/case-details\/case-officer$/],
	['Plan band', /^\/case\/.+\/overview\/case-details\/plan-band$/],
	['Contact details', /^\/case\/.+\/overview\/contacts\/check-contact-details$/],
	['Programme Officer details', /^\/case\/.+\/overview\/contacts\/programme-officer$/],
	['Examination website', /^\/case\/.+\/overview\/contacts\/examination-website$/],
	['Assessor Gateway 2', /^\/case\/.+\/overview\/contacts\/assessor-gateway-2$/],
	['Assessor Gateway 3', /^\/case\/.+\/overview\/contacts\/assessor-gateway-3$/],
	['Examining Inspector 1', /^\/case\/.+\/overview\/contacts\/examining-inspector-1$/],
	['Examining Inspector 2', /^\/case\/.+\/overview\/contacts\/examining-inspector-2$/],
	['Examining Inspector 3', /^\/case\/.+\/overview\/contacts\/examining-inspector-3$/],
	['QA Inspector 1', /^\/case\/.+\/overview\/contacts\/qa-inspector-1$/],
	['QA Inspector 2', /^\/case\/.+\/overview\/contacts\/qa-inspector-2$/],
	['QA Inspector 3', /^\/case\/.+\/overview\/contacts\/qa-inspector-3$/]
];

export class CaseOverviewPage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/overview$/);
	}

	get serviceNavigation() {
		return cy.getByData('service-navigation');
	}

	get deleteCaseButton() {
		return cy.getByData('delete-case-button');
	}

	sectionHeading(text: string) {
		return cy.contains('h2', text);
	}

	overviewActionLinkFor(key: string) {
		return this.summaryRowActionLink(key);
	}

	verifyLoaded(planTitle?: string) {
		super.verifyLoaded();

		if (planTitle) {
			this.verifyHeading(planTitle);
		}
	}

	verifyServiceNavigation(...items: string[]) {
		const serviceNavigation = this.serviceNavigation.should('be.visible');

		items.forEach((item) => {
			serviceNavigation.should('contain.text', item);
		});
	}

	openServiceNavigationItem(item: string) {
		this.serviceNavigation.contains('a', item).should('be.visible').click();
	}

	verifyExpectedServiceNavigation() {
		this.verifyServiceNavigation(...serviceNavigationItems);
	}

	verifySectionHeading(text: string) {
		this.sectionHeading(text).should('be.visible');
	}

	verifyExpectedSectionHeadings() {
		this.verifySectionHeading('Overview');
		this.verifySectionHeading('Contacts');
	}

	verifySummaryRows(...keys: string[]) {
		keys.forEach((key) => {
			this.summaryRow(key).should('be.visible');
		});
	}

	verifyExpectedSummaryRows() {
		overviewSummaryRows.forEach(({ row }) => {
			this.verifySummaryRows(row);
		});
	}

	verifyExpectedSeededAnswers() {
		overviewExpectedAnswers.forEach(({ row, display }) => {
			this.verifySummaryRowContains(row, display);
		});

		this.verifySummaryRowContains(
			localPlanningAuthority.row,
			localPlanningAuthority.lpa1Value,
			localPlanningAuthority.lpa2Value
		);

		this.verifySummaryRowContains(
			'Contact details',
			'Jane',
			'Smith',
			'jane@lpa.gov.uk',
			'01234567890',
			'Bob',
			'Johnson',
			'bob@lpa.gov.uk'
		);

		this.verifySummaryRowContains(
			programmeOfficer.row,
			programmeOfficer.values.firstName,
			programmeOfficer.values.lastName,
			programmeOfficer.values.email
		);
	}

	verifyActionLinkHref(key: string, pathPattern: RegExp) {
		this.verifySummaryRowActionHref(key, pathPattern, this.overviewActionLinkFor(key));
	}

	verifyExpectedActionLinkHrefs() {
		actionLinkHrefs.forEach(([key, pathPattern]) => {
			this.verifyActionLinkHref(key, pathPattern);
		});
	}

	openActionLinkFor(key: string) {
		this.overviewActionLinkFor(key).should('be.visible').click();
	}

	verifyDeleteCaseButton() {
		this.deleteCaseButton
			.should('be.visible')
			.and('have.attr', 'href')
			.and('match', /^\/case\/.+\/delete-case$/);
	}

	verifyExaminationWebsiteHyperlink(hyperlink: string) {
		cy.get(`a[href="${hyperlink}"]`)
			.should('be.visible')
			.and('have.attr', 'href', `${hyperlink}`)
			.and('have.attr', 'target', '_blank');
	}

	navigateToDeletePage() {
		this.deleteCaseButton.should('be.visible').click();
	}
}

export const caseOverviewPage = new CaseOverviewPage();
