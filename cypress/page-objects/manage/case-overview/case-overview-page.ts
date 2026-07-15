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

const summaryRows = [
	'Plan title',
	'Plan type',
	'Local Planning Authority',
	'Case officer',
	'Plan band',
	'Contact details',
	'Programme Officer',
	'Examination website',
	'Assessor Gateway 2',
	'Assessor Gateway 3',
	'Examining Inspector 1',
	'Examining Inspector 2',
	'Examining Inspector 3',
	'QA Inspector 1',
	'QA Inspector 2',
	'QA Inspector 3'
];

const actionLinkHrefs: Array<[string, RegExp]> = [
	['Plan title', /^\/case\/.+\/overview\/case-details\/plan-title$/],
	['Plan type', /^\/case\/.+\/overview\/case-details\/plan-type$/],
	['Local Planning Authority', /^\/case\/.+\/overview\/case-details\/check-lpas$/],
	['Case officer', /^\/case\/.+\/overview\/case-details\/case-officer$/],
	['Plan band', /^\/case\/.+\/overview\/case-details\/plan-band$/],
	['Contact details', /^\/case\/.+\/overview\/contacts\/check-contact-details$/],
	['Programme Officer', /^\/case\/.+\/overview\/contacts\/programme-officer$/],
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
		this.verifySummaryRows(...summaryRows);
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
		cy.contains('button.govuk-button', 'Delete case').should('be.visible');
	}
}

export const caseOverviewPage = new CaseOverviewPage();
