import { openSeededGateway2Page } from '../../../../flows/manage/gateway-2-flow.ts';
import {
	gateway2AssessorAnswer,
	gateway2DateAnswers,
	workshopVenueAnswer
} from '../../../../fixtures/manage/gateway-2.ts';
import {
	gateway2Page,
	gateway2EstimatedDatePage,
	gateway2ActualDatePage,
	gateway2ValidDatePage,
	gateway2AssessorPage,
	workshopDatePage,
	workshopVenuePage,
	assessorDateOfAppointmentPage,
	reportIssuedDatePage,
	reportPublishedByLPADatePage
} from '../../../../page-objects/manage/gateway-2/index.ts';

describe('Gateway 2 page content', () => {
	beforeEach(() => {
		cy.task('clearDb');
	});

	after(() => cy.task('clearDb'));

	it('displays the Gateway 2 tab content for a case', { tags: ['smoke', 'regression'] }, () => {
		openSeededGateway2Page();

		gateway2Page.verifyBackLink('/');
		gateway2Page.verifySectionHeading('Gateway 2');
		gateway2Page.verifyExpectedRows();
		gateway2Page.verifyExpectedSeededAnswers();
		gateway2Page.verifyExpectedActionLinkHrefs();
	});

	it('loads Gateway 2 estimated date page', { tags: ['regression'] }, () => {
		openSeededGateway2Page();

		gateway2Page.openActionLinkFor(gateway2DateAnswers.gateway2EstimatedDate.row);

		gateway2EstimatedDatePage.verifyLoaded(gateway2DateAnswers.gateway2EstimatedDate.input);
	});

	it('loads Gateway 2 actual date page', { tags: ['regression'] }, () => {
		openSeededGateway2Page();

		gateway2Page.openActionLinkFor(gateway2DateAnswers.gateway2ActualDate.row);

		gateway2ActualDatePage.verifyLoaded(gateway2DateAnswers.gateway2ActualDate.input);
	});

	it('loads Gateway 2 valid date page', { tags: ['regression'] }, () => {
		openSeededGateway2Page();

		gateway2Page.openActionLinkFor(gateway2DateAnswers.gateway2ValidDate.row);

		gateway2ValidDatePage.verifyLoaded(gateway2DateAnswers.gateway2ValidDate.input);
	});

	it('loads Gateway 2 assessor name page', { tags: ['regression'] }, () => {
		openSeededGateway2Page();

		gateway2Page.openActionLinkFor(gateway2AssessorAnswer.row);

		gateway2AssessorPage.verifyLoaded(gateway2AssessorAnswer.heading);
		gateway2AssessorPage.assessorNamePopulated(gateway2AssessorAnswer.assessor1);
	});

	it('loads Gateway 2 assessor date of appointment page', { tags: ['regression'] }, () => {
		openSeededGateway2Page();

		gateway2Page.openActionLinkFor(gateway2DateAnswers.assessorDateOfAppointment.row);

		assessorDateOfAppointmentPage.verifyLoaded(gateway2DateAnswers.assessorDateOfAppointment.input);
	});

	it('loads Gateway 2 workshop date page', { tags: ['regression'] }, () => {
		openSeededGateway2Page();

		gateway2Page.openActionLinkFor(gateway2DateAnswers.workshopDate.row);

		workshopDatePage.verifyLoaded(gateway2DateAnswers.workshopDate.input);
	});

	it('loads Gateway 2 workshop venue page', { tags: ['regression'] }, () => {
		openSeededGateway2Page();

		gateway2Page.openActionLinkFor(workshopVenueAnswer.row);

		workshopVenuePage.verifyLoaded(workshopVenueAnswer.heading);
		workshopVenuePage.verifyWorkshopVenueForm(workshopVenueAnswer.value);
	});

	it('loads Gateway 2 report issued date page', { tags: ['regression'] }, () => {
		openSeededGateway2Page();

		gateway2Page.openActionLinkFor(gateway2DateAnswers.reportIssuedDate.row);

		reportIssuedDatePage.verifyLoaded(gateway2DateAnswers.reportIssuedDate.input);
	});

	it('loads Gateway 2 report published by LPA date page', { tags: ['regression'] }, () => {
		openSeededGateway2Page();

		gateway2Page.openActionLinkFor(gateway2DateAnswers.reportPublishedDate.row);

		reportPublishedByLPADatePage.verifyLoaded(gateway2DateAnswers.reportPublishedDate.input);
	});
});
