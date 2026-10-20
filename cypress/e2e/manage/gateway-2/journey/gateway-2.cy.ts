import {
	gateway2Page,
	gateway2AssessorPage,
	gateway2ActualDatePage,
	gateway2ExpectedDatePage,
	gateway2ReportCheckPage,
	gateway2ReportPage,
	gateway2WorkshopDocumentsCheckPage,
	gateway2WorkshopDocumentsPage
} from '../../../../page-objects/manage/gateway-2/index.ts';
import { openGateway2Page, openSeededGateway2Page } from '../../../../flows/manage/gateway-2-flow.ts';
import { cleanupSeededManageCase, type SeededManageCase } from '../../../../flows/manage/seeded-case-flow.ts';
import { seededCase } from '../../../../fixtures/manage/case.ts';
import { manageHomePage } from '../../../../page-objects/manage/home-page.ts';
import {
	gateway2AssessorAnswer,
	gateway2DateAnswers,
	gateway2Report,
	gateway2WorkshopDocuments,
	updatedGateway2ExpectedDateAnswer
} from '../../../../fixtures/manage/gateway-2.ts';

describe('Gateway 2 updates', () => {
	beforeEach(() => {
		cy.task('clearDb');
		openSeededGateway2Page();
	});
	afterEach(cleanupSeededManageCase);
	after(() => cy.task('clearDb'));

	it('updates a Gateway 2 date answer', { tags: ['regression'] }, () => {
		gateway2Page.openActionLinkFor(gateway2DateAnswers.gateway2ExpectedDate.row);

		gateway2ExpectedDatePage.verifyLoaded(gateway2DateAnswers.gateway2ExpectedDate.input);
		gateway2ExpectedDatePage.enterDate(updatedGateway2ExpectedDateAnswer.input);

		gateway2Page.verifyLoaded(seededCase.planTitle);
		gateway2Page.verifySummaryRowContains(
			gateway2DateAnswers.gateway2ExpectedDate.row,
			updatedGateway2ExpectedDateAnswer.display
		);
	});

	it('updates the Gateway 2 assessor name answer', { tags: ['regression'] }, () => {
		gateway2Page.openActionLinkFor(gateway2AssessorAnswer.row);

		gateway2AssessorPage.verifyLoaded();
		gateway2AssessorPage.assessorNamePopulated(gateway2AssessorAnswer.assessor1);
		gateway2AssessorPage.enterAssessorName(gateway2AssessorAnswer.assessor2);

		gateway2Page.verifyLoaded(seededCase.planTitle);
		gateway2Page.verifySummaryRowContains(gateway2AssessorAnswer.row, gateway2AssessorAnswer.assessor2);
	});

	it(
		'keeps the issued Gateway 2 report when a replacement is removed',
		{ tags: ['regression', 'environment-smoke'] },
		() => {
			gateway2Page.openActionLinkFor(gateway2Report.row);
			gateway2ReportPage.verifyLoaded();

			gateway2ReportPage.uploadAndVerifyFile(gateway2Report.fileName);
			gateway2ReportPage.saveAndReturn();

			gateway2ReportCheckPage.verifyLoaded(gateway2Report.fileName);
			gateway2ReportCheckPage.issueReport();

			gateway2Page.verifyLoaded(seededCase.planTitle);
			gateway2Page.verifySummaryRowContains(gateway2Report.row, gateway2Report.fileName);

			gateway2Page.openActionLinkFor(gateway2Report.row);
			gateway2ReportPage.verifyLoaded();
			gateway2ReportPage.uploadAndVerifyFile(gateway2Report.updatedFileName);
			cy.intercept('POST', '**/delete-document/**').as('removeReport');
			gateway2ReportPage.removeFile(gateway2Report.updatedFileName);
			cy.wait('@removeReport').then(({ request, response }) => {
				const requestPath = new URL(request.url).pathname;
				const location = response?.headers.location;
				const redirectPath = location ? new URL(String(location), request.url).pathname : 'none';

				return cy
					.task(
						'log',
						`Remove report: ${requestPath}; status: ${response?.statusCode ?? 'no response'}; redirect: ${redirectPath}`
					)
					.then(() => {
						expect(response?.statusCode, 'Remove report response status').to.eq(302);
						expect(redirectPath, 'Remove report redirect').to.eq(requestPath.split('/delete-document/')[0]);
					});
			});
			gateway2ReportPage.verifyLoaded();
			gateway2ReportPage.verifyFileNotUploaded(gateway2Report.updatedFileName);
			gateway2ReportPage.goBack();

			gateway2Page.verifyLoaded(seededCase.planTitle);
			gateway2Page.verifySummaryRowContains(gateway2Report.row, gateway2Report.fileName);
		}
	);

	it('discards an unconfirmed Gateway 2 report after using the Back link', { tags: ['regression'] }, () => {
		gateway2Page.openActionLinkFor(gateway2Report.row);
		gateway2ReportPage.verifyLoaded();
		gateway2ReportPage.uploadAndVerifyFile(gateway2Report.fileName);
		gateway2ReportPage.goBack();

		gateway2Page.verifyLoaded(seededCase.planTitle);
		gateway2Page.openActionLinkFor(gateway2Report.row);
		gateway2ReportPage.verifyLoaded();
		gateway2ReportPage.verifyFileNotUploaded(gateway2Report.fileName);
	});

	it('discards an unconfirmed Gateway 2 report after leaving for Home', { tags: ['regression'] }, () => {
		gateway2Page.openActionLinkFor(gateway2Report.row);
		gateway2ReportPage.verifyLoaded();

		cy.location('pathname').then((uploadPath) => {
			gateway2ReportPage.uploadAndVerifyFile(gateway2Report.fileName);
			gateway2ReportPage.openServiceNavigationItem('Plans Examination back office');
			manageHomePage.verifyLoaded();

			gateway2ReportPage.visit(uploadPath);
			gateway2ReportPage.verifyLoaded();
			gateway2ReportPage.verifyFileNotUploaded(gateway2Report.fileName);
		});
	});

	it('does not show issued workshop documents against another case', { tags: ['regression'] }, () => {
		gateway2Page.openActionLinkFor(gateway2WorkshopDocuments.row);
		gateway2WorkshopDocumentsPage.verifyLoaded();
		gateway2WorkshopDocumentsPage.uploadAndVerifyFile(gateway2WorkshopDocuments.fileName);
		gateway2WorkshopDocumentsPage.saveAndReturn();
		gateway2WorkshopDocumentsCheckPage.verifyLoaded(gateway2WorkshopDocuments.fileName);
		gateway2WorkshopDocumentsCheckPage.issueDocuments();

		cy.task<SeededManageCase>('seedDb').then((secondCase) => {
			openGateway2Page(secondCase.reference, secondCase.planTitle);
			gateway2Page.openActionLinkFor(gateway2WorkshopDocuments.row);
			gateway2WorkshopDocumentsPage.verifyLoaded();
			gateway2WorkshopDocumentsPage.verifyFileNotUploaded(gateway2WorkshopDocuments.fileName);
		});
	});

	it('returns to Gateway 2 from Gateway 2 answer page back links', { tags: ['regression'] }, () => {
		gateway2Page.openActionLinkFor(gateway2DateAnswers.gateway2ActualDate.row);
		gateway2ActualDatePage.verifyLoaded(gateway2DateAnswers.gateway2ActualDate.input);
		gateway2ActualDatePage.goBack();

		gateway2Page.verifyLoaded(seededCase.planTitle);
	});
});
