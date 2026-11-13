import { completeCreateCaseFlow } from '../../flows/manage/create-case-flow.ts';
import {
	caseCreatedPage,
	checkYourAnswersPage,
	type CreateCaseData
} from '../../page-objects/manage/create-case/index.ts';
import { portalLoginForExistingCase } from '../../flows/portal/login-flow.ts';
import { submitGateway2Application } from '../../flows/portal/gateway-2-submission-flow.ts';
import {
	gateway2CoverLetterPage,
	localPlanTimetablePage
} from '../../page-objects/portal/gw2-application/gateway-2-uploads-page.ts';
import { gateway2SubmittedPlan } from '../../fixtures/portal/gateway-2-uploads.ts';
import { applicationCompletePage } from '../../page-objects/portal/gw2-application/application-complete-page.ts';
import { planDetailsPage } from '../../page-objects/portal/plan-details/plan-details-page.ts';
import { issueGateway2Report, openGateway2Page, workshopSetUpFlow } from '../../flows/manage/gateway-2-flow.ts';

const loadCreateCaseData = () => cy.fixture<CreateCaseData>('manage/create-case.json');
const portal = { baseUrl: Cypress.env('portalBaseUrl') };
type Journey = CreateCaseData & { reference: string };
const JOURNEY_FILE = 'cypress/reports/full-journey.json';
const loadJourney = () => cy.readFile<Journey>(JOURNEY_FILE);

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

	// it('4. Portal: submits Gateway 3');
	// it('5. Manage: issues Gateway 3 resubmission required decision');
	// it('6. Portal: resubmits Gateway 3');
	// it('7. Manage: issues Gateway 3 proceed decision');
	// it('8. Portal: submits Examination');
	// it('9. Manage: assigns inspector, uploads MIQs, issues final report, enters adoption date');
	// it('10. Portal: shows Plan adopted');
});
