import { workshopSetUpFlow, openGateway2Page } from '../../flows/manage/gateway-2-flow.ts';
import { FOURTH_TEST_EMAIL, manageToPortalLogin } from '../../flows/portal/login-flow.ts';
import { verifyGateway2WorkshopInPortal } from '../../flows/cross-service/gateway-2-workshop-flow.ts';
import { workshopSetUp } from '../../fixtures/manage/gateway-2.ts';

const CASE_REFERENCE = 'PLAN-C02';
const PLAN_TITLE = 'GW2SubmittedNotIssued';
const fullVenueAddress = `${workshopSetUp.workshopVenueAddress.values.venueName}, ${workshopSetUp.workshopVenueAddress.values.addressLine1}, ${workshopSetUp.workshopVenueAddress.values.townOrCity}, ${workshopSetUp.workshopVenueAddress.values.postcode}`;
const fullDateAndTime = `${workshopSetUp.workshopDateAndTime.display} at ${workshopSetUp.workshopDateAndTime.displayTime}`;

describe('Cross-service Gateway 2 report', () => {
	beforeEach(() => {
		cy.task('clearDb');
		cy.task('seedCase');
	});

	after(() => cy.task('clearDb'));

	it('Shows the Workshop data for Gateway 2 in Portal once it is entered in Manage', () => {
		openGateway2Page(CASE_REFERENCE, PLAN_TITLE);

		manageToPortalLogin(FOURTH_TEST_EMAIL);

		openGateway2Page(CASE_REFERENCE, PLAN_TITLE);
		workshopSetUpFlow(PLAN_TITLE);

		verifyGateway2WorkshopInPortal(CASE_REFERENCE, fullVenueAddress, fullDateAndTime);
	});
});
