import { completeCreateCaseFlow } from '../../flows/manage/create-case-flow.ts';
import {
	caseCreatedPage,
	checkYourAnswersPage,
	type CreateCaseData
} from '../../page-objects/manage/create-case/index.ts';
import { portalLoginForExistingCase } from '../../flows/portal/login-flow.ts';
import { submitGateway2Application } from '../../flows/portal/gateway-2-submission-flow.ts';
import { submitGateway3Application } from '../../flows/portal/gateway-3-submission-flow.ts';
import {
	gateway2CoverLetterPage,
	localPlanTimetablePage
} from '../../page-objects/portal/gw2-application/gateway-2-uploads-page.ts';
import { gateway2SubmittedPlan } from '../../fixtures/portal/gateway-2-uploads.ts';
import { applicationCompletePage } from '../../page-objects/portal/gw2-application/application-complete-page.ts';
import { planDetailsPage } from '../../page-objects/portal/plan-details/plan-details-page.ts';
import { issueGateway2Report, openGateway2Page, workshopSetUpFlow } from '../../flows/manage/gateway-2-flow.ts';
import { myPlansPage } from '../../page-objects/portal/my-plans-page.ts';
import { gateway3ApplicationPage } from '../../page-objects/portal/gw3-application/gateway-3-application-page.ts';
import {
	mapOfProposedLocalPlanPoliciesPage,
	statementOfCompliancePage,
	proposedLocalPlanPage,
	statementOfSoundnessPage,
	consultationEngagementSummaryPage,
	scopingConsultationSummaryPage,
	consultationContentEvidenceSummaryPage,
	consultationProposedPlanSummaryPage,
	practicalArrangementsStatementPage
} from '../../page-objects/portal/gw3-application/gateway-3-uploads-page.ts';
import { gateway3DeclarationPage } from '../../page-objects/portal/gw3-application/declaration-page.ts';
import { gateway3SubmissionCompletePage } from '../../page-objects/portal/gw3-application/gateway-3-submission-complete-page.ts';
import {
	openGateway3Page,
	issueGateway3ResubmissionDecision,
	issueGateway3Submission2ProceedDesision
} from '../../flows/manage/gateway-3-flow.ts';
import { submitGateway3Resubmission } from '../../flows/portal/gateway-3-resubmission-flow.ts';
import { gateway3ResubmissionSubmissionCompletePage } from '../../page-objects/portal/gw3-application/gateway-3-resubmission-submission-complete-page.ts';
import * as examinationUploads from '../../page-objects/portal/examination/examination-uploads-page.ts';
import { submitExaminationApplication } from '../../flows/portal/examination-submission-flow.ts';
import { examinationDeclarationPage } from '../../page-objects/portal/examination/declaration-page.ts';
import { examinationSubmissionCompletePage } from '../../page-objects/portal/examination/examination-submission-complete-page.ts';
import {
	openExaminationPage,
	uploadExaminationMIQDocuments,
	uploadExaminationFinalReportDocuments
} from '../../flows/manage/examination-flow.ts';
import { examinationPage, examiningInspector1Page } from '../../page-objects/manage/examination/index.ts';
import { examiningInspector1, adoptionDate } from '../../fixtures/manage/examination.ts';
import { adoptionDatePage } from '../../page-objects/manage/examination/report-page.ts';

const loadCreateCaseData = () => cy.fixture<CreateCaseData>('manage/create-case.json');
const portal = { baseUrl: Cypress.env('portalBaseUrl') };
type Journey = CreateCaseData & { reference: string };
const JOURNEY_FILE = 'cypress/reports/full-journey.json';
const loadJourney = () => cy.readFile<Journey>(JOURNEY_FILE);
const FILE_NAME = 'test-document.pdf';

describe('Full journey: case creation to Plan adopted', () => {
	it('1. Manage: creates the case', () => {
		cy.task('clearDb');
		cy.task('seedDb');

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
			portalLoginForExistingCase(journey.contact.email);

			submitGateway2Application({ reference: journey.reference }, [
				{ page: gateway2CoverLetterPage, fileNames: [gateway2SubmittedPlan.coveringLetter] },
				{ page: localPlanTimetablePage, fileNames: gateway2SubmittedPlan.timetableFiles }
			]);

			applicationCompletePage.returnToYourPlanLink(journey.reference).click();
			planDetailsPage.verifyLoaded();
			planDetailsPage.verifyProgressRow(
				'Gateway 2',
				`Submission expected: ${journey.dates.gateway2Date.display}`,
				'Under review'
			);
		});
	});

	it('3. Manage: sets up workshop and issues Gateway 2 report', () => {
		loadJourney().then((journey) => {
			openGateway2Page(journey.reference, journey.planTitle);
			workshopSetUpFlow(journey.planTitle);
			issueGateway2Report(journey.planTitle);
		});
	});

	it('4. Portal: submits Gateway 3', portal, () => {
		loadJourney().then((journey) => {
			portalLoginForExistingCase(journey.contact.email);

			myPlansPage.openPlan(journey.reference);
			planDetailsPage.verifyLoaded();
			planDetailsPage.verifyProgressRow(
				'Gateway 2',
				`Submission expected: ${journey.dates.gateway2Date.display}`,
				'Completed'
			);
			planDetailsPage.verifyProgressRow(
				'Gateway 3',
				`Submission expected: ${journey.dates.gateway3Date.display}`,
				'Ready to start'
			);
			planDetailsPage.gateway3Link.click();

			gateway3ApplicationPage.verifyLoaded();
			submitGateway3Application(
				{ urlReference: journey.reference },
				[
					{ page: proposedLocalPlanPage, fileNames: [FILE_NAME] },
					{ page: mapOfProposedLocalPlanPoliciesPage, fileNames: [FILE_NAME] },
					{ page: statementOfCompliancePage, fileNames: [FILE_NAME] },
					{ page: statementOfSoundnessPage, fileNames: [FILE_NAME] },
					{ page: consultationEngagementSummaryPage, fileNames: [FILE_NAME] },
					{ page: scopingConsultationSummaryPage, fileNames: [FILE_NAME] },
					{ page: consultationContentEvidenceSummaryPage, fileNames: [FILE_NAME] },
					{ page: consultationProposedPlanSummaryPage, fileNames: [FILE_NAME] },
					{ page: practicalArrangementsStatementPage, fileNames: [FILE_NAME] }
				],
				'https://testWebsite.com'
			);
			gateway3DeclarationPage.confirmSubmissionButton.click();
			gateway3SubmissionCompletePage.verifyLoaded();
			gateway3SubmissionCompletePage.checkSubmissionStatusLink(journey.reference).click();
			planDetailsPage.verifyLoaded();
			planDetailsPage.verifyProgressRow(
				'Gateway 3',
				`Submission expected: ${journey.dates.gateway3Date.display}`,
				'Under review'
			);
		});
	});

	it('5. Manage: issues Gateway 3 resubmission required decision', () => {
		loadJourney().then((journey) => {
			openGateway3Page(journey.reference, journey.planTitle);
			issueGateway3ResubmissionDecision(journey.planTitle);
		});
	});

	it('6. Portal: resubmits Gateway 3', portal, () => {
		loadJourney().then((journey) => {
			portalLoginForExistingCase(journey.contact.email);
			myPlansPage.openPlan(journey.reference);
			planDetailsPage.verifyLoaded();
			planDetailsPage.verifyProgressRow(
				'Gateway 3',
				`Submission expected: ${journey.dates.gateway3Date.display}`,
				'Resubmission required'
			);
			submitGateway3Resubmission(journey.reference, FILE_NAME);
			gateway3ResubmissionSubmissionCompletePage.checkSubmissionStatusLink(journey.reference).click();

			planDetailsPage.verifyLoaded();
			planDetailsPage.verifyProgressRow(
				'Gateway 3',
				`Submission expected: ${journey.dates.gateway3Date.display}`,
				'Under review'
			);
		});
	});

	it('7. Manage: issues Gateway 3 proceed decision', () => {
		loadJourney().then((journey) => {
			openGateway3Page(journey.reference, journey.planTitle);
			issueGateway3Submission2ProceedDesision(journey.planTitle, FILE_NAME);
		});
	});

	it('8. Portal: submits Examination', portal, () => {
		loadJourney().then((journey) => {
			portalLoginForExistingCase(journey.contact.email);

			myPlansPage.openPlan(journey.reference);
			planDetailsPage.verifyLoaded();
			planDetailsPage.verifyProgressRow(
				'Gateway 3',
				`Submission expected: ${journey.dates.gateway3Date.display}`,
				'Completed'
			);
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
			planDetailsPage.verifyProgressRow(
				'Examination',
				`Submission expected: ${journey.dates.expectedSubmissionForExaminationDate.display}`,
				'Submitted'
			);
		});
	});

	it('9. Manage: assigns inspector, uploads MIQs, issues final report, enters adoption date', () => {
		loadJourney().then((journey) => {
			openExaminationPage({ reference: journey.reference, planTitle: journey.planTitle });
			examinationPage.openActionLinkFor(examiningInspector1.row);

			examiningInspector1Page.verifyLoaded();
			examiningInspector1Page.enterLookupAnswer(examiningInspector1.display);

			examinationPage.verifySummaryRowContains(examiningInspector1.row, examiningInspector1.display);

			uploadExaminationMIQDocuments();

			uploadExaminationFinalReportDocuments();

			examinationPage.openActionLinkFor(adoptionDate.row);

			adoptionDatePage.verifyLoaded();
			adoptionDatePage.enterDate(adoptionDate.input);
			adoptionDatePage.saveAndContinue();

			examinationPage.verifySummaryRowContains(adoptionDate.row, adoptionDate.display);
		});
	});

	it('10. Portal: shows Plan adopted', portal, () => {
		loadJourney().then((journey) => {
			portalLoginForExistingCase(journey.contact.email);

			myPlansPage.openPlan(journey.reference);
			planDetailsPage.verifyLoaded();
			planDetailsPage.verifyProgressRow(
				'Examination',
				`Adopted: ${journey.dates.adoptionDate.display}`,
				'Plan adopted'
			);
		});
	});
});
