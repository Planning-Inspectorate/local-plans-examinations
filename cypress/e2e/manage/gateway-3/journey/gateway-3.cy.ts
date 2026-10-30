import {
	gateway3Page,
	gateway3AssessorPage,
	gateway3ProgrammeOfficerPage,
	gateway3ActualDatePage,
	gateway3ExpectedDatePage,
	gateway3ExaminationWebsitePage,
	gateway3DecisionPage,
	gateway3DocumentsPage,
	gateway3DocumentsCheckPage,
	gateway3ReviewDocumentsPage
} from '../../../../page-objects/manage/gateway-3/index.ts';
import { caseHistoryPage } from '../../../../page-objects/manage/case-history/index.ts';
import { examinationPage } from '../../../../page-objects/manage/examination/index.ts';
import {
	openGateway3ReviewDocumentsPage,
	openSeededGateway3Page,
	openSeededGateway3PageWithSubmissionDocuments
} from '../../../../flows/manage/gateway-3-flow.ts';
import { seededCase } from '../../../../fixtures/manage/case.ts';
import {
	gateway3AssessorAnswer,
	gateway3DateAnswers,
	gateway3DecisionAnswer,
	gateway3ExaminationWebsite,
	gateway3ExaminationWebsiteDocumentLabel,
	gateway3OptionalSubmissionDocumentLabels,
	gateway3ProgrammeOfficerAnswer,
	gateway3RequiredSubmissionDocuments,
	updatedGateway3ExpectedDateAnswer,
	gateway3DocumentsAnswer
} from '../../../../fixtures/manage/gateway-3.ts';
import { cleanupSeededManageCase } from '../../../../flows/manage/seeded-case-flow.ts';
import { manageHomePage } from '../../../../page-objects/manage/home-page.ts';

const today = new Date();
const todayDisplay = today.toLocaleDateString('en-GB', {
	day: 'numeric',
	month: 'long',
	year: 'numeric',
	timeZone: 'GMT'
});

const openCaseHistory = () => {
	gateway3Page.openServiceNavigationItem('Case History');
	caseHistoryPage.verifyLoaded();
};

describe('Gateway 3 updates', () => {
	beforeEach(() => {
		cy.task('clearDb');
		openSeededGateway3Page();
	});
	afterEach(cleanupSeededManageCase);

	after(() => cy.task('clearDb'));

	it('updates a Gateway 3 date answer and records case history', { tags: ['regression'] }, () => {
		gateway3Page.openActionLinkFor(gateway3DateAnswers.gateway3ExpectedDate.row);

		gateway3ExpectedDatePage.verifyLoaded(gateway3DateAnswers.gateway3ExpectedDate.input);
		gateway3ExpectedDatePage.enterDate(updatedGateway3ExpectedDateAnswer.input);

		gateway3Page.verifyLoaded(seededCase.planTitle);
		gateway3Page.verifySummaryRowContains(
			gateway3DateAnswers.gateway3ExpectedDate.row,
			updatedGateway3ExpectedDateAnswer.display
		);

		openCaseHistory();
		// Known gap: Gateway 3 fields aren't in caseHistoryLabels; asserting only the prefix since raw Date.toString() is timezone dependent
		caseHistoryPage.verifyHistoryEvent('Expected updated from');
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
		caseHistoryPage.verifyHistoryEvent('Assessor updated from assessor-1 to assessor-2');
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

		openCaseHistory();
		caseHistoryPage.verifyHistoryEvent(
			`Programme Officer first name updated from ${gateway3ProgrammeOfficerAnswer.firstName} to Updated`
		);
		caseHistoryPage.verifyHistoryEvent(
			`Programme Officer last name updated from ${gateway3ProgrammeOfficerAnswer.lastName} to Officer`
		);
		caseHistoryPage.verifyHistoryEvent(
			`Programme Officer email address updated from ${gateway3ProgrammeOfficerAnswer.email} to updated.officer@test.com`
		);
	});

	it(
		'updates the Examination website from Gateway 3 and shows the same link on Examination',
		{ tags: ['regression', 'environment-smoke'] },
		() => {
			gateway3Page.openActionLinkFor(gateway3ExaminationWebsite.row);

			gateway3ExaminationWebsitePage.verifyLoaded('');
			gateway3ExaminationWebsitePage.enterAnswer(gateway3ExaminationWebsite.value);

			gateway3Page.verifyLoaded(seededCase.planTitle);
			gateway3Page.verifySummaryRowContains(gateway3ExaminationWebsite.row, gateway3ExaminationWebsite.value);
			gateway3Page.verifySummaryRowValueLinkHref(gateway3ExaminationWebsite.row, gateway3ExaminationWebsite.href);

			gateway3Page.openServiceNavigationItem('Examination');
			examinationPage.verifyLoaded(seededCase.planTitle);
			examinationPage.verifySummaryRowContains(gateway3ExaminationWebsite.row, gateway3ExaminationWebsite.value);
			examinationPage.verifySummaryRowValueLinkHref(gateway3ExaminationWebsite.row, gateway3ExaminationWebsite.href);
		}
	);

	it('returns to Gateway 3 from the Examination website page without saving', { tags: ['regression'] }, () => {
		gateway3Page.openActionLinkFor(gateway3ExaminationWebsite.row);
		gateway3ExaminationWebsitePage.verifyLoaded('');
		gateway3ExaminationWebsitePage.fillAnswer(gateway3ExaminationWebsite.unsavedValue);
		gateway3ExaminationWebsitePage.goBack();

		gateway3Page.verifyLoaded(seededCase.planTitle);
		gateway3Page.verifySummaryRowContains(gateway3ExaminationWebsite.row, gateway3ExaminationWebsite.display);
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

describe('Gateway 3 submission documents', () => {
	const requiredDocumentCount = gateway3RequiredSubmissionDocuments.length;

	beforeEach(() => {
		cy.task('clearDb');
	});

	after(() => cy.task('clearDb'));

	it(
		'opens the review documents page from the Gateway 3 tab and lists the submitted documents',
		{ tags: ['regression'] },
		() => {
			openSeededGateway3PageWithSubmissionDocuments(reference, seededCase.planTitle).then(({ reference }) => {
				openGateway3ReviewDocumentsPage();

				gateway3ReviewDocumentsPage.verifyLoaded(reference);
				gateway3ReviewDocumentsPage.verifyNoMissingDocumentErrors();
				gateway3RequiredSubmissionDocuments.forEach(({ label, fileName }) => {
					gateway3ReviewDocumentsPage.verifyDocumentAdded(label, fileName);
				});
				gateway3ReviewDocumentsPage.verifyDocumentNotAdded(gateway3ExaminationWebsiteDocumentLabel);
				gateway3OptionalSubmissionDocumentLabels.forEach((documentLabel) => {
					gateway3ReviewDocumentsPage.verifyDocumentNotAdded(documentLabel);
				});
			});
		}
	);

	it('opens the Gateway 3 decision when every required document has been added', { tags: ['regression'] }, () => {
		openSeededGateway3PageWithSubmissionDocuments();
		openGateway3ReviewDocumentsPage();

		gateway3ReviewDocumentsPage.issueDecision();

		gateway3DecisionPage.verifyLoaded();
	});

	it('selects a gateway 3 resubmission decision and verifies new submission row', { tags: ['regression'] }, () => {
		openSeededGateway3PageWithSubmissionDocuments();
		gateway3Page.openActionLinkFor(gateway3DecisionAnswer.row);

		gateway3DecisionPage.verifyLoaded();
		gateway3DecisionPage.selectDecision('Resubmit');

		gateway3DocumentsPage.uploadAndVerifyFile(gateway3DocumentsAnswer.fileName);
		gateway3DocumentsPage.uploadAndVerifyFile(gateway3DocumentsAnswer.fileName2);

		gateway3DocumentsPage.saveAndReturn();

		gateway3DocumentsCheckPage.verifyLoaded([gateway3DocumentsAnswer.fileName, gateway3DocumentsAnswer.fileName2]);
		gateway3DocumentsCheckPage.issueDecision();

		gateway3Page.verifyLoaded(seededCase.planTitle);
		gateway3Page.verifyGateway3SubmissionIssued('Resubmission required');
		gateway3Page.verifySubmissionDocumentsReviewLink(requiredDocumentCount);
		gateway3Page.verifySubHeading('Gateway 3 submission 2');
		gateway3Page.verifyHeaderStatus('GW3 pending');

		gateway3Page.goBack();
		manageHomePage.verifyCaseStatus(seededCase.planTitle, 'GW3 pending');
	});
});
