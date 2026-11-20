import {
	authenticateManageIfRequired,
	authenticatePortalIfRequired,
	isEnvironmentSmoke
} from '../../flows/auth-flow.ts';

// Manage
import { completeCreateCaseFlow } from '../../flows/manage/create-case-flow.ts';
import { issueGateway2Report, openGateway2Page, workshopSetUpFlow } from '../../flows/manage/gateway-2-flow.ts';
import {
	openGateway3Page,
	issueGateway3ResubmissionDecision,
	issueGateway3Submission2ProceedDecision
} from '../../flows/manage/gateway-3-flow.ts';
import {
	openExaminationPage,
	setUpHearing,
	uploadExaminationMIQDocuments,
	uploadExaminationFinalReportDocuments
} from '../../flows/manage/examination-flow.ts';
import {
	caseCreatedPage,
	checkYourAnswersPage,
	type CreateCaseData
} from '../../page-objects/manage/create-case/index.ts';
import { gateway2Page } from '../../page-objects/manage/gateway-2/index.ts';
import { gateway3Page } from '../../page-objects/manage/gateway-3/index.ts';
import {
	adoptionDatePage,
	examinationPage,
	examiningInspector1Page
} from '../../page-objects/manage/examination/index.ts';

// Portal
import { portalLoginWithSession } from '../../flows/portal/login-flow.ts';
import { submitGateway2Application } from '../../flows/portal/gateway-2-submission-flow.ts';
import { submitGateway3Application } from '../../flows/portal/gateway-3-submission-flow.ts';
import { submitGateway3Resubmission } from '../../flows/portal/gateway-3-resubmission-flow.ts';
import { submitExaminationApplication } from '../../flows/portal/examination-submission-flow.ts';
import { myPlansPage } from '../../page-objects/portal/my-plans-page.ts';
import { planDetailsPage } from '../../page-objects/portal/plan-details/plan-details-page.ts';
import { gateway2ApplicationPage } from '../../page-objects/portal/gw2-application/gateway-2-application-page.ts';
import {
	gateway2CoverLetterPage,
	localPlanTimetablePage
} from '../../page-objects/portal/gw2-application/gateway-2-uploads-page.ts';
import { applicationCompletePage } from '../../page-objects/portal/gw2-application/application-complete-page.ts';
import { gateway3ApplicationPage } from '../../page-objects/portal/gw3-application/gateway-3-application-page.ts';
import * as gateway3Uploads from '../../page-objects/portal/gw3-application/gateway-3-uploads-page.ts';
import { gateway3DeclarationPage } from '../../page-objects/portal/gw3-application/declaration-page.ts';
import { gateway3SubmissionCompletePage } from '../../page-objects/portal/gw3-application/gateway-3-submission-complete-page.ts';
import { gateway3ResubmissionSubmissionCompletePage } from '../../page-objects/portal/gw3-application/gateway-3-resubmission-submission-complete-page.ts';
import { examinationPage as portalExaminationPage } from '../../page-objects/portal/examination/examination-application-page.ts';
import * as examinationUploads from '../../page-objects/portal/examination/examination-uploads-page.ts';
import { examinationDeclarationPage } from '../../page-objects/portal/examination/declaration-page.ts';
import { examinationSubmissionCompletePage } from '../../page-objects/portal/examination/examination-submission-complete-page.ts';

// Fixtures
import { gateway2Report } from '../../fixtures/manage/gateway-2.ts';
import {
	adoptionDate,
	examinationReport,
	examiningInspector1,
	hearingDateAndTime,
	MIQcheckPage
} from '../../fixtures/manage/examination.ts';
import { gateway2SubmittedPlan } from '../../fixtures/portal/gateway-2-uploads.ts';

const loadCreateCaseData = () => cy.fixture<CreateCaseData>('manage/create-case.json');
const portal = { baseUrl: Cypress.env('portalBaseUrl') };
type Journey = CreateCaseData & { reference: string };
const JOURNEY_FILE = 'cypress/reports/full-journey.json';
const loadJourney = () => cy.readFile<Journey>(JOURNEY_FILE);
const FILE_NAME = 'test-document.pdf';
const todayDisplay = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

describe('Full journey: case creation to Plan adopted', () => {
	beforeEach(() => {
		if (Cypress.config('baseUrl') === Cypress.env('portalBaseUrl')) {
			authenticatePortalIfRequired();
		} else {
			authenticateManageIfRequired();
		}
	});

	after(() => {
		if (isEnvironmentSmoke()) {
			loadJourney().then((journey) => cy.task('softDeleteCaseByReference', journey.reference));
		}
		cy.task('clearDb');
	});

	it('1. Manage: creates the case', () => {
		cy.task('clearDb');
		if (!isEnvironmentSmoke()) cy.task('seedDb'); // local only: real environments already have LPAs

		loadCreateCaseData().then((data) => {
			completeCreateCaseFlow(data);
			checkYourAnswersPage.verifyLoaded();
			checkYourAnswersPage.submitCase();
			caseCreatedPage.verifyLoaded();
			caseCreatedPage.verifyReferenceFormat();
			caseCreatedPage.getReference().then((reference) => {
				cy.writeFile(JOURNEY_FILE, { ...data, reference });
			});
		});
	});

	it('2. Portal: submits Gateway 2', portal, () => {
		loadJourney().then((journey) => {
			portalLoginWithSession(journey.contact.email);

			submitGateway2Application({ reference: journey.reference }, [
				{ page: gateway2CoverLetterPage, fileNames: [gateway2SubmittedPlan.coveringLetter] },
				{ page: localPlanTimetablePage, fileNames: gateway2SubmittedPlan.timetableFiles }
			]);

			applicationCompletePage.returnToYourPlanLink(journey.reference).click();
			planDetailsPage.verifyLoaded();
			planDetailsPage.verifyProgressRow('Gateway 2', `Submitted: ${todayDisplay}`, 'Under review');
		});
	});

	it('3. Manage: sets up workshop and issues Gateway 2 report', () => {
		loadJourney().then((journey) => {
			openGateway2Page(journey.reference, journey.planTitle);
			gateway2Page.verifySummaryRowContains('Submission documents', '3 document(s)');
			gateway2Page.verifyHeaderStatus('GW2 received');

			workshopSetUpFlow(journey.planTitle);

			issueGateway2Report(journey.planTitle);

			gateway2Page.verifyHeaderStatus('GW3 pending');
		});
	});

	it('4. Portal: submits Gateway 3', portal, () => {
		loadJourney().then((journey) => {
			portalLoginWithSession(journey.contact.email);

			myPlansPage.openPlan(journey.reference);
			planDetailsPage.verifyLoaded();
			planDetailsPage.verifyProgressRow('Gateway 2', `Completed: ${todayDisplay}`, 'Completed');
			// planDetailsPage.verifyProgressRow(
			// 	'Gateway 3',
			// 	`Submission expected: ${journey.dates.gateway3Date.display}`,
			// 	'Ready to start'
			// );
			planDetailsPage.gateway3Link.click();

			gateway3ApplicationPage.verifyLoaded();
			submitGateway3Application(
				{ urlReference: journey.reference },
				[
					{ page: gateway3Uploads.proposedLocalPlanPage, fileNames: [FILE_NAME] },
					{ page: gateway3Uploads.mapOfProposedLocalPlanPoliciesPage, fileNames: [FILE_NAME] },
					{ page: gateway3Uploads.statementOfCompliancePage, fileNames: [FILE_NAME] },
					{ page: gateway3Uploads.statementOfSoundnessPage, fileNames: [FILE_NAME] },
					{ page: gateway3Uploads.consultationEngagementSummaryPage, fileNames: [FILE_NAME] },
					{ page: gateway3Uploads.scopingConsultationSummaryPage, fileNames: [FILE_NAME] },
					{ page: gateway3Uploads.consultationContentEvidenceSummaryPage, fileNames: [FILE_NAME] },
					{ page: gateway3Uploads.consultationProposedPlanSummaryPage, fileNames: [FILE_NAME] },
					{ page: gateway3Uploads.practicalArrangementsStatementPage, fileNames: [FILE_NAME] }
				],
				'https://testWebsite.com'
			);
			gateway3DeclarationPage.confirmSubmissionButton.click();
			gateway3SubmissionCompletePage.verifyLoaded();
			gateway3SubmissionCompletePage.checkSubmissionStatusLink(journey.reference).click();
			planDetailsPage.verifyLoaded();
			planDetailsPage.verifyProgressRow('Gateway 3', `Submitted: ${todayDisplay}`, 'Under review');

			gateway2ApplicationPage.visit(journey.reference);
			gateway2ApplicationPage.verifySummaryRowContains(
				'Gateway 2 report',
				gateway2Report.fileName,
				`(shared on ${todayDisplay})`
			);
		});
	});

	it('5. Manage: issues Gateway 3 resubmission required decision', () => {
		loadJourney().then((journey) => {
			openGateway3Page(journey.reference, journey.planTitle);
			gateway3Page.verifySubmissionDocumentsReviewLink(9);
			gateway3Page.verifyHeaderStatus('GW3 received');

			issueGateway3ResubmissionDecision(journey.planTitle);
		});
	});

	it('6. Portal: resubmits Gateway 3', portal, () => {
		loadJourney().then((journey) => {
			portalLoginWithSession(journey.contact.email);
			myPlansPage.openPlan(journey.reference);
			planDetailsPage.verifyLoaded();
			// planDetailsPage.verifyProgressRow(
			// 	'Gateway 3',
			// 	`Submission expected: ${journey.dates.gateway3Date.display}`,
			// 	'Resubmission required'
			// );
			submitGateway3Resubmission(journey.reference, FILE_NAME);
			gateway3ResubmissionSubmissionCompletePage.checkSubmissionStatusLink(journey.reference).click();

			planDetailsPage.verifyLoaded();
			planDetailsPage.verifyProgressRow('Gateway 3', `Submitted: ${todayDisplay}`, 'Under review');
		});
	});

	it('7. Manage: issues Gateway 3 proceed decision', () => {
		loadJourney().then((journey) => {
			openGateway3Page(journey.reference, journey.planTitle);
			gateway3Page.verifyHeaderStatus('GW3 received');

			issueGateway3Submission2ProceedDecision(journey.planTitle, FILE_NAME);

			gateway3Page.verifyHeaderStatus('Submission pending');
		});
	});

	it('8. Portal: submits Examination', portal, () => {
		loadJourney().then((journey) => {
			portalLoginWithSession(journey.contact.email);

			myPlansPage.openPlan(journey.reference);
			planDetailsPage.verifyLoaded();
			planDetailsPage.verifyProgressRow('Gateway 3', `Completed: ${todayDisplay}`, 'Completed');
			planDetailsPage.verifyProgressRow(
				'Examination',
				`Submission expected: ${journey.dates.expectedSubmissionForExaminationDate.display}`,
				'Ready to start'
			);
			submitExaminationApplication({ urlReference: journey.reference }, [
				{ page: examinationUploads.localPlanSubmissionForExaminationPage, fileNames: [FILE_NAME] },
				{ page: examinationUploads.mapOfProposedLocalPlanPoliciesPage, fileNames: [FILE_NAME] },
				{ page: examinationUploads.gateway3CompletionStatementPage, fileNames: [FILE_NAME] },
				{ page: examinationUploads.consultationEngagementSummaryPage, fileNames: [FILE_NAME] },
				{ page: examinationUploads.consultationProposedPlanSummaryPage, fileNames: [FILE_NAME] },
				{ page: examinationUploads.statementOfCompliancePage, fileNames: [FILE_NAME] },
				{ page: examinationUploads.statementOfSoundnessPage, fileNames: [FILE_NAME] }
			]);
			examinationDeclarationPage.confirmSubmissionButton.click();
			examinationSubmissionCompletePage.verifyLoaded();
			examinationSubmissionCompletePage.checkSubmissionStatusLink.click();

			planDetailsPage.verifyLoaded();
			planDetailsPage.verifyProgressRow('Examination', `Submitted: ${todayDisplay}`, 'Submitted');
		});
	});

	it('9. Manage: assigns inspector and sets up hybrid hearing', () => {
		loadJourney().then((journey) => {
			openExaminationPage({ reference: journey.reference, planTitle: journey.planTitle });
			examinationPage.openActionLinkFor(examiningInspector1.row);

			examiningInspector1Page.getFirstOption().then((inspector) => {
				examiningInspector1Page.enterLookupAnswer(inspector);
				examinationPage.verifySummaryRowContains(examiningInspector1.row, inspector);
			});

			examinationPage.verifyHeaderStatus('Exam in progress');

			setUpHearing({ date: hearingDateAndTime.date, time: hearingDateAndTime.time, type: 'hybrid', expectedDays: '4' });
		});
	});

	it('10. Portal: shows In examination', portal, () => {
		loadJourney().then((journey) => {
			portalLoginWithSession(journey.contact.email);
			portalExaminationPage.visit(journey.reference);
			portalExaminationPage.verifyLoaded();
			portalExaminationPage.verifyStatusTag('In examination');
		});
	});

	it('11. Manage: uploads MIQs and issues final report', () => {
		loadJourney().then((journey) => {
			openExaminationPage({ reference: journey.reference, planTitle: journey.planTitle });
			uploadExaminationMIQDocuments();

			uploadExaminationFinalReportDocuments();
		});
	});

	it('12. Portal: shows Report issued with the MIQs and final report', portal, () => {
		loadJourney().then((journey) => {
			portalLoginWithSession(journey.contact.email);
			portalExaminationPage.visit(journey.reference);
			portalExaminationPage.verifyLoaded();
			portalExaminationPage.verifyStatusTag('Report issued');
			portalExaminationPage.verifyExaminationReportDownloads(examinationReport.fileName, todayDisplay);
			portalExaminationPage.verifySummaryRowContains(
				'Matters, issues and questions',
				MIQcheckPage.file1,
				MIQcheckPage.file2
			);
		});
	});

	it('13. Manage: enters adoption date', () => {
		loadJourney().then((journey) => {
			openExaminationPage({ reference: journey.reference, planTitle: journey.planTitle });

			examinationPage.openActionLinkFor(adoptionDate.row);

			adoptionDatePage.verifyLoaded();
			adoptionDatePage.enterDate(adoptionDate.input);

			examinationPage.verifySummaryRowContains(adoptionDate.row, adoptionDate.display);
			examinationPage.verifyHeaderStatus('Plan adopted');
		});
	});

	it('14. Portal: shows Plan adopted', portal, () => {
		loadJourney().then((journey) => {
			portalLoginWithSession(journey.contact.email);

			myPlansPage.openPlan(journey.reference);
			planDetailsPage.verifyLoaded();
			planDetailsPage.verifyProgressRow('Examination', `Adopted: ${adoptionDate.display}`, 'Plan adopted');

			portalExaminationPage.visit(journey.reference);
			portalExaminationPage.verifyLoaded();
			portalExaminationPage.verifyExaminationReportDownloads(examinationReport.fileName, todayDisplay);
			portalExaminationPage.verifySummaryRowContains(
				'Matters, issues and questions',
				MIQcheckPage.file1,
				MIQcheckPage.file2
			);
		});
	});
});
