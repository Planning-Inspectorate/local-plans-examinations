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
import { gateway2UploadAnswers } from 'cypress/fixtures/portal/gateway-2-uploads.ts';

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

	it.only('displays files uploaded to the FO in the BO GW2 Submission Documents', () => {
		manageHomePage.visit();
		manageHomePage.getReference().then((caseReference) => {
			const portalPlanReference = toPortalPlanReference(caseReference);
			manageToPortalLogin(FIXTURE_TEST_EMAIL);

			const doc = gateway2UploadAnswers.coveringLetter;
			const fileName = 'test-document.pdf';

			cy.fixture(`files/${fileName}`, 'base64').then((base64) => {
				cy.origin(
					Cypress.env('portalBaseUrl'),
					{ args: { portalPlanReference, fileName, base64, doc } },
					({ portalPlanReference, fileName, base64, doc }) => {
						cy.visit(`/manage-local-plans/${portalPlanReference}/gateway-2-submission`);
						cy.get(`[data-cy="${doc.addCy}"]`).should('be.visible').click();

						const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

						cy.get(`#${doc.fieldName}-input`).selectFile(
							{ contents: binary, fileName, mimeType: 'application/pdf' },
							{ force: true }
						);
						cy.get('[data-cy="upload-files-button"]').click();
						cy.get('.govuk-summary-list__value').should('contain', 'test-document.pdf');

						cy.get('[data-cy="save-and-return-button"]').click();
					}
				);
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
