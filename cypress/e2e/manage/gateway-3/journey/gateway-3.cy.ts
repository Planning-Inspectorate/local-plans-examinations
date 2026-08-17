import {
	gateway3Page,
	gateway3AssessorPage,
	gateway3ProgrammeOfficerPage,
	gateway3ActualDatePage,
	gateway3EstimatedDatePage
} from '../../../../page-objects/manage/gateway-3/index.ts';
import { caseHistoryPage } from '../../../../page-objects/manage/case-history/index.ts';
import { openSeededGateway3Page } from '../../../../flows/manage/gateway-3-flow.ts';
import { seededCase } from '../../../../fixtures/manage/case.ts';
import {
	gateway3AssessorAnswer,
	gateway3DateAnswers,
	gateway3ProgrammeOfficerAnswer,
	updatedGateway3EstimatedDateAnswer
} from '../../../../fixtures/manage/gateway-3.ts';

const today = new Date();
const todayDisplay = today.toLocaleDateString('en-GB', {
	day: 'numeric',
	month: 'long',
	year: 'numeric',
	timeZone: 'GMT'
});

describe('Gateway 3 updates', () => {
	beforeEach(() => {
		cy.task('clearDb');
		openSeededGateway3Page();
	});

	// after(() => cy.task('clearDb'));

	it('updates a Gateway 3 date answer and records case history', { tags: ['regression'] }, () => {
		gateway3Page.openActionLinkFor(gateway3DateAnswers.gateway3EstimatedDate.row);

		gateway3EstimatedDatePage.verifyLoaded(gateway3DateAnswers.gateway3EstimatedDate.input);
		gateway3EstimatedDatePage.enterDate(updatedGateway3EstimatedDateAnswer.input);

		gateway3Page.verifyLoaded(seededCase.planTitle);
		gateway3Page.verifySummaryRowContains(
			gateway3DateAnswers.gateway3EstimatedDate.row,
			updatedGateway3EstimatedDateAnswer.display
		);

		gateway3Page.openServiceNavigationItem('Case History');
		caseHistoryPage.verifyLoaded();
		// Known gap: Gateway 3 fields aren't in caseHistoryLabels; asserting only the prefix since raw Date.toString() is timezone dependent
		caseHistoryPage.verifyHistoryEvent('Updated estimatedDate from');
	});

	it('updates the Gateway 3 assessor name answer', { tags: ['regression'] }, () => {
		gateway3Page.openActionLinkFor(gateway3AssessorAnswer.row);

		gateway3AssessorPage.verifyLoaded();
		gateway3AssessorPage.assessorNamePopulated(gateway3AssessorAnswer.assessor1);
		gateway3AssessorPage.enterAssessorName(gateway3AssessorAnswer.assessor2);

		gateway3Page.verifyLoaded(seededCase.planTitle);
		gateway3Page.verifySummaryRowContains(gateway3AssessorAnswer.row, gateway3AssessorAnswer.assessor2);

		gateway3Page.openServiceNavigationItem('Case History');
		caseHistoryPage.verifyLoaded();
		caseHistoryPage.verifyHistoryEvent('Updated assessorName from assessor-1 to assessor-2');
	});

	it('updates the programme officer details answer and records case history', { tags: ['regression'] }, () => {
		gateway3Page.openActionLinkFor(gateway3ProgrammeOfficerAnswer.row);

		gateway3ProgrammeOfficerPage.verifyLoaded(
			gateway3ProgrammeOfficerAnswer.firstName,
			gateway3ProgrammeOfficerAnswer.lastName,
			gateway3ProgrammeOfficerAnswer.email
		);
		gateway3ProgrammeOfficerPage.enterProgrammeOfficerDetails('Updated', 'Officer', 'updated.officer@test.com');

		gateway3Page.verifyLoaded(seededCase.planTitle);
		gateway3Page.verifySummaryRowContains(
			gateway3ProgrammeOfficerAnswer.row,
			'Updated',
			'Officer',
			'updated.officer@test.com'
		);

		gateway3Page.openServiceNavigationItem('Case History');
		caseHistoryPage.verifyLoaded();
		caseHistoryPage.verifyHistoryEvent(
			`Updated programmeOfficerFirstName from ${gateway3ProgrammeOfficerAnswer.firstName} to Updated`
		);
		caseHistoryPage.verifyHistoryEvent(
			`Updated programmeOfficerLastName from ${gateway3ProgrammeOfficerAnswer.lastName} to Officer`
		);
		caseHistoryPage.verifyHistoryEvent(
			`Updated programmeOfficerEmail from ${gateway3ProgrammeOfficerAnswer.email} to updated.officer@test.com`
		);
	});

	it(
		'auto-fills the assessor date of appointment when the assessor name is saved and records case history',
		{ tags: ['regression'] },
		() => {
			gateway3Page.openActionLinkFor(gateway3AssessorAnswer.row);

			gateway3AssessorPage.verifyLoaded();
			gateway3AssessorPage.enterAssessorName(gateway3AssessorAnswer.assessor2);

			gateway3Page.verifyLoaded(seededCase.planTitle);
			gateway3Page.verifySummaryRowContains(gateway3DateAnswers.gateway3AssessorDateAppointment.row, todayDisplay);
		}
	);

	it('returns to Gateway 3 from Gateway 3 answer page back links', { tags: ['regression'] }, () => {
		gateway3Page.openActionLinkFor(gateway3DateAnswers.gateway3ActualDate.row);
		gateway3ActualDatePage.verifyLoaded(gateway3DateAnswers.gateway3ActualDate.input);
		gateway3ActualDatePage.goBack();

		gateway3Page.verifyLoaded(seededCase.planTitle);

		gateway3Page.openActionLinkFor(gateway3ProgrammeOfficerAnswer.row);
		gateway3ProgrammeOfficerPage.verifyLoaded(
			gateway3ProgrammeOfficerAnswer.firstName,
			gateway3ProgrammeOfficerAnswer.lastName,
			gateway3ProgrammeOfficerAnswer.email
		);
		gateway3ProgrammeOfficerPage.goBack();

		gateway3Page.verifyLoaded(seededCase.planTitle);
	});
});
