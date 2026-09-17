import { toPortalPlanReference } from '../../flows/cross-service/service-apps.ts';
import { completeCreateCaseFlow } from '../../flows/manage/create-case-flow.ts';
import {
	caseCreatedPage,
	checkYourAnswersPage,
	type CreateCaseData
} from '../../page-objects/manage/create-case/index.ts';
import { gateway2ApplicationPage } from '../../page-objects/portal/gw2-application/gateway-2-application-page.ts';
import { manageToPortalLogin } from '../../flows/portal/login-flow.ts';
import { manageHomePage } from '../../page-objects/manage/home-page.ts';
//import { seededCase } from '../../fixtures/manage/case.ts';
import type { PlanDetailsFixture } from '../../fixtures/portal/types.ts';
import { gateway2CoverLetterPage } from '../../page-objects/portal/gw2-application/gateway-2-uploads.page.ts';
import { openGateway2DocumentUploadPage } from '../../flows/portal/gateway-2-upload-flow.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

export const CREATE_CASE_TEST_EMAIL = 'test@planninginspectorate.gov.uk';
export const FIXTURE_TEST_EMAIL = 'cypress@test.com';

const loadCreateCaseData = () => cy.fixture<CreateCaseData>('manage/create-case.json');

describe('Cross-service Manage and Portal', () => {
	beforeEach(() => {
		cy.task('clearDb');
		cy.task('seedDb');
	});

	after(() => cy.task('clearDb'));

	it('opens a Manage-created case in the Portal Gateway 2 submission journey', () => {
		loadCreateCaseData().then((data) => {
			completeCreateCaseFlow(data);
			checkYourAnswersPage.verifyLoaded();
			checkYourAnswersPage.submitCase();
			caseCreatedPage.verifyLoaded();

			caseCreatedPage.getReference().then((caseReference) => {
				const portalPlanReference = toPortalPlanReference(caseReference);

				manageToPortalLogin(CREATE_CASE_TEST_EMAIL);
				gateway2ApplicationPage.openForCrossServiceAndVerify(portalPlanReference, data.planTitle);
			});
		});
	});

	it('displays files uploaded to the FO in the BO GW2 Submission Documents', () => {
		manageHomePage.visit();
		manageHomePage.getReference().then((caseReference) => {
			const portalPlanReference = toPortalPlanReference(caseReference);
			manageToPortalLogin(FIXTURE_TEST_EMAIL);

			const page = gateway2CoverLetterPage;
			loadPlanDetails().then((plan) => {
				const newPlan: PlanDetailsFixture = {
					...plan,
					reference: portalPlanReference
				};
				openGateway2DocumentUploadPage(newPlan, page);
			});
		});
		//file upload journeys
		//open bo case
		//gw2
		//file count
		//submission documents
		//content check
	});
});
