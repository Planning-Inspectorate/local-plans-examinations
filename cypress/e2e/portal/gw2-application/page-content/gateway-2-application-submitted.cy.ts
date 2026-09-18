import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { submitGateway2Application } from '../../../../flows/portal/gateway-2-submission-flow.ts';
import { gateway2ApplicationPage } from '../../../../page-objects/portal/gw2-application/gateway-2-application-page.ts';
import {
	localPlanTimetablePage,
	gateway2CoverLetterPage
} from '../../../../page-objects/portal/gw2-application/gateway-2-uploads.page.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');
const today = new Date();
const todayDisplay = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

describe('Gateway 2 application page content after submission', () => {
	beforeEach(() => {
		portalLogin();
	});

	after(() => cy.task('clearDb'));

	it('shows the Gateway 2 submission data has been recorded correctly', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			submitGateway2Application(plan, [
				{ page: gateway2CoverLetterPage, fileNames: ['test-document.pdf'] },
				{ page: localPlanTimetablePage, fileNames: ['test-document.docx', 'test-document.xlsx'] }
			]);

			gateway2ApplicationPage.visit(plan.urlReference);
			gateway2ApplicationPage.verifyLoaded();

			gateway2ApplicationPage.verifySubmissionData(todayDisplay, 'test@planninginspectorate.gov.uk');

			gateway2ApplicationPage.verifyDocumentRowContains(
				gateway2ApplicationPage.proceduralDocumentsTable,
				'Gateway 2 covering letter',
				'test-document.pdf'
			);

			gateway2ApplicationPage.verifyDocumentRowContains(
				gateway2ApplicationPage.proceduralDocumentsTable,
				'Local plan timetable',
				'test-document.docx',
				'test-document.xlsx'
			);

			gateway2ApplicationPage.verifyNoAddOrChangeLinks();
			gateway2ApplicationPage.verifySubmitGateway2ButtonNotShown();
		});
	});
});
