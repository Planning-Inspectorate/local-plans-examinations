import { toPortalPlanReference } from '../../flows/cross-service/service-apps.ts';
import { completeCreateCaseFlow } from '../../flows/manage/create-case-flow.ts';
import {
	caseCreatedPage,
	checkYourAnswersPage,
	type CreateCaseData
} from '../../page-objects/manage/create-case/index.ts';
import { gateway2ApplicationPage } from '../../page-objects/portal/gw2-application/gateway-2-application-page.ts';

const loadCreateCaseData = () => cy.fixture<CreateCaseData>('manage/create-case.json');

describe('Cross-service Manage and Portal', () => {
	beforeEach(() => {
		cy.task('clearDb');
		cy.task('seedStaticData');
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

				gateway2ApplicationPage.openForCrossServiceAndVerify(portalPlanReference, data.planTitle);
			});
		});
	});
});
