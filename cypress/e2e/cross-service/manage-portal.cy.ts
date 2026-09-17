import { toPortalPlanReference } from '../../flows/cross-service/service-apps.ts';
import { completeCreateCaseFlow } from '../../flows/manage/create-case-flow.ts';
import { openGateway2DocumentUploadPage } from '../../flows/portal/gateway-2-upload-flow.ts';
import {
	caseCreatedPage,
	checkYourAnswersPage,
	type CreateCaseData
} from '../../page-objects/manage/create-case/index.ts';
import { gateway2ApplicationPage } from '../../page-objects/portal/gw2-application/gateway-2-application-page.ts';
import { manageToPortalLogin, portalLoginForExistingCase } from '../../flows/portal/login-flow.ts';
import { gateway2CoverLetterPage } from '../../page-objects/portal/gw2-application/gateway-2-uploads.page.ts';

export const CREATE_CASE_TEST_EMAIL = 'test@planninginspectorate.gov.uk';
export const FIXTURE_TEST_EMAIL = 'cypress@test.com';

const loadCreateCaseData = () => cy.fixture<CreateCaseData>('manage/create-case.json');

describe('Cross-service Manage and Portal', () => {
	beforeEach(() => {
		cy.task('clearDb');
		cy.task<{ reference: string }>('seedDb').as('seededCase');
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
		cy.get<{ reference: string }>('@seededCase').then(({ reference }) => {
			const portalPlanReference = toPortalPlanReference(reference);
			const fileName = 'test-document.pdf';

			portalLoginForExistingCase(FIXTURE_TEST_EMAIL);
			openGateway2DocumentUploadPage({ reference: portalPlanReference }, gateway2CoverLetterPage);
			gateway2CoverLetterPage.uploadAndVerifyFile(fileName);
			gateway2CoverLetterPage.saveAndReturn();
			gateway2ApplicationPage.verifyLoaded();
			gateway2ApplicationPage.verifyDocumentRowContains(
				gateway2ApplicationPage.proceduralDocumentsTable,
				'Gateway 2 covering letter',
				fileName
			);

			cy.origin(Cypress.env('manageBaseUrl'), { args: { reference, fileName } }, ({ reference, fileName }) => {
				cy.visit(`/case/${encodeURIComponent(reference)}/gateway-2`);
				cy.contains('.govuk-summary-list__row', 'Submission documents').contains('a', 'Review').click();
				cy.contains('h1', 'Submitted GW2 documents').should('be.visible');
				cy.contains('.govuk-summary-list__row', 'Gateway 2 covering letter')
					.contains('.govuk-summary-list__value a', fileName)
					.should('be.visible');
			});
		});
	});
});
