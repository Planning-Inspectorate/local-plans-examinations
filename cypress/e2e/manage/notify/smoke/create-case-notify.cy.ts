import {
	authenticateManageIfRequired,
	getRequiredCypressEnv,
	skipUnlessNotifySmokeEnabled,
	skipUnlessRealEnvironmentAuth
} from '../../../../flows/auth-flow.ts';
import { completeCreateCaseFlow } from '../../../../flows/manage/create-case-flow.ts';
import {
	caseCreatedPage,
	checkYourAnswersPage,
	type CreateCaseData
} from '../../../../page-objects/manage/create-case/index.ts';

const loadCreateCaseData = () => cy.fixture<CreateCaseData>('manage/create-case.json');
const notifyFailureStatuses = ['permanent-failure', 'temporary-failure', 'technical-failure'];

describe('Manage Notify smoke', () => {
	let createdCaseReference: string | undefined;

	before(function () {
		skipUnlessRealEnvironmentAuth(this);
		skipUnlessNotifySmokeEnabled(this);
	});

	after(() => {
		if (createdCaseReference) {
			cy.task('softDeleteCaseByReference', createdCaseReference);
		}
	});

	it('sends a case-created email through Notify', { tags: ['smoke', 'environment-smoke'] }, () => {
		const notifySmokeEmail = getRequiredCypressEnv('notifySmokeEmail');
		const runId = Date.now();

		loadCreateCaseData().then((data) => {
			const notifyCaseData: CreateCaseData = {
				...data,
				planTitle: `Notify smoke ${runId}`,
				contact: {
					...data.contact,
					email: notifySmokeEmail
				}
			};

			authenticateManageIfRequired();
			completeCreateCaseFlow(notifyCaseData, { caseOfficer: 'first-available' });
			checkYourAnswersPage.verifyLoaded();
			checkYourAnswersPage.submitCase();
			caseCreatedPage.verifyLoaded();

			caseCreatedPage.getReference().then((caseReference) => {
				createdCaseReference = caseReference;
				const notifyReference = `create-case:${caseReference}`;

				cy.task('waitForNotifyEmailByReference', { reference: notifyReference }, { timeout: 90000 }).then(
					(notification) => {
						expect(notification).to.include({ reference: notifyReference });
						const notificationId = (notification as { id?: string }).id;
						const notificationStatus = (notification as { status?: string }).status;

						expect(notificationId).to.match(/\S+/);
						expect(notificationStatus).to.match(/\S+/);
						expect(notifyFailureStatuses).not.to.include(notificationStatus);
					}
				);
			});
		});
	});
});
