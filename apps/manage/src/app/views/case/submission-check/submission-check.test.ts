import { SubmissionCheck, type SubmissionCheckData } from './submission-check.ts';
import { SignedSLASubmissionCheck } from './signed-sla-submission-check.ts';
import { Gateway2ReportSubmissionCheck } from './gateway-2-report-submission-check.ts';
import { Gateway2DocumentSubmissionCheck } from './gateway-2-document-submission-check.ts';
import { Gateway2WorkshopDocumentsSubmissionCheck } from './gateway-2-workshop-documents-submission-check.ts';
import { Gateway3SubmissionCheck } from './gateway-3-submission-check.ts';
import { ExaminationReportSubmissionCheck } from './examination-report-submission-check.ts';
import { MiqsSubmissionCheck } from './miqs-submission-check.ts';
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { configureNunjucks } from '../../../nunjucks.ts';

describe('Manage virus scan templates', () => {
	const viewData = {
		caseReference: 'PLAN-123456',
		config: { headerTitle: 'Manage', footerLinks: [] },
		navigation: [],
		summaryListData: { sections: [] },
		layoutTemplate: 'views/layouts/main.njk',
		question: { title: 'Documents' },
		dataRows: [],
		answersToReview: []
	};
	for (const template of ['case-overview.njk', 'custom-file-manager/index.njk']) {
		it(`renders pending and multiple infected files in ${template}`, () => {
			const html = configureNunjucks().render(`views/layouts/${template}`, {
				...viewData,
				virusScanInProgress: true,
				virusErrorSummary: ['first.pdf', 'second.pdf'].map((fileName, index) => ({
					text: `${fileName} contains a virus. Remove the file and upload a different version.`,
					href: `#uploaded-file-${index}`
				}))
			});
			assert.ok(html.includes('data-cy="virus-scan-in-progress-banner"'));
			assert.ok(html.includes('Important'));
			assert.ok(html.includes('Virus scan in progress'));
			assert.ok(html.includes('Refresh the page to see if the scan has finished'));
			assert.ok(html.includes('data-cy="virus-detected-banner"'));
			for (const fileName of ['first.pdf', 'second.pdf']) {
				assert.ok(html.includes(`${fileName} contains a virus. Remove the file and upload a different version.`));
			}
		});
	}

	for (const template of [
		'case-overview.njk',
		'custom-file-manager/index.njk',
		'submit-documents-check-your-answers.njk'
	]) {
		it(`omits scan banners for clean files in ${template}`, () => {
			const html = configureNunjucks().render(`views/layouts/${template}`, {
				...viewData,
				virusScanInProgress: false
			});
			assert.ok(!html.includes('data-cy="virus-scan-in-progress-banner"'));
			assert.ok(!html.includes('data-cy="virus-detected-banner"'));
		});
	}

	it('shows the pending scan banner on the document confirmation page', () => {
		const html = configureNunjucks().render('views/layouts/submit-documents-check-your-answers.njk', {
			...viewData,
			virusScanInProgress: true
		});
		assert.ok(html.includes('data-cy="virus-scan-in-progress-banner"'));
		assert.ok(html.includes('Refresh the page to see if the scan has finished'));
	});
});

const MockService = {
	db: {
		gateway1Info: {
			findUnique: mock.fn<() => {}>()
		},
		gateway2Info: {
			findUnique: mock.fn<() => {}>()
		},
		gateway3Info: {
			findUnique: mock.fn<() => {}>()
		},
		examinationInfo: {
			findUnique: mock.fn<() => {}>()
		},
		caseHistory: {
			findFirst: mock.fn(async () => null)
		},
		document: {
			findMany: mock.fn<() => {}>()
		}
	}
};
describe('Gateway2DocumentSubmissionCheck', () => {
	it('retains the section and documents using the shared scan-aware answer format', async () => {
		MockService.db.document.findMany.mock.mockImplementation(async () => []);

		const data = await new Gateway2DocumentSubmissionCheck().generateDataForPage(
			'case-id',
			'PLAN-123456',
			'gateway-2',
			'documents',
			'covering-letter',
			'/case/PLAN-123456/gateway-2/documents/covering-letter/check',
			MockService as never,
			[
				{
					id: 'file-1',
					fileName: 'letter.pdf',
					virusCheckStatus: 'not_scanned',
					metadata: { documentGuid: 'document-1' }
				}
			],
			'Covering letter'
		);

		assert.equal(data.titleHeading, 'Check document');
		assert.equal(data.submitButtonText, 'Upload document');
		assert.equal(data.backLink, '/case/PLAN-123456/gateway-2/gateway-2/gateway2Documents');
		assert.deepEqual(data.answersToReview, [
			{ name: 'Section', value: 'Covering letter', url: undefined },
			{
				name: 'Covering letter documents',
				value: 'Not provided',
				url: '/case/PLAN-123456/gateway-2/documents/covering-letter'
			}
		]);
	});
});

async function testGenerateDataForPage(
	submissionCheck: SubmissionCheck,
	generateDataForPageArgs: object,
	expectedResult: SubmissionCheckData
) {
	const actualResult = await submissionCheck.generateDataForPage(
		...(Object.values(generateDataForPageArgs) as [string, string, string, string, string, string, any, any])
	);
	assert.deepEqual(actualResult, expectedResult);
}

describe('Test SignedSLASubmissionCheck', () => {
	it('SignedSLASubmissionCheck.generateDataForPage with no existing data', async () => {
		MockService.db.gateway1Info.findUnique.mock.mockImplementation(async () => {
			return {
				slaSentDate: null,
				slaReceivedDate: null
			};
		});
		await testGenerateDataForPage(
			new SignedSLASubmissionCheck(),
			{
				caseId: '123456',
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				questionUrl: 'my-question',
				originalUrl: '/PLAN-12345/some-journey/some-section/my-question/check',
				service: MockService,
				uploadedFiles: [
					{ fileName: 'fileA.txt', metadata: { documentGuid: 'fileAGuid' } },
					{ fileName: 'fileB.txt', metadata: { documentGuid: 'fileBGuid' } }
				]
			},
			{
				titleHeading: 'Check signed SLA and issue notification',
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				question: 'my-question',
				backLink: '/PLAN-12345/some-journey/some-section/my-question',
				notificationPreviewTemplate: 'my-question',
				submitButtonText: 'Confirm and issue notification',
				notificationTextLPA: undefined,
				answersToReview: [
					{
						name: 'Date uploaded',
						value: null,
						url: '/case/PLAN-12345/some-journey/some-section/sla-received-date'
					},
					{
						name: 'Signed SLA document 1',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileAGuid">fileA.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/signed-sla'
					},
					{
						name: 'Signed SLA document 2',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileBGuid">fileB.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/signed-sla'
					}
				]
			}
		);
	});
	it('SignedSLASubmissionCheck.generateDataForPage with existing data', async () => {
		MockService.db.gateway1Info.findUnique.mock.mockImplementation(async () => {
			return {
				slaSentDate: new Date(2026, 0, 1),
				slaReceivedDate: null
			};
		});
		await testGenerateDataForPage(
			new SignedSLASubmissionCheck(),
			{
				caseId: '123456',
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				questionUrl: 'my-question',
				originalUrl: '/PLAN-12345/some-journey/some-section/my-question/check',
				service: MockService,
				uploadedFiles: [
					{ fileName: 'fileA.txt', metadata: { documentGuid: 'fileAGuid' } },
					{ fileName: 'fileB.txt', metadata: { documentGuid: 'fileBGuid' } }
				]
			},
			{
				titleHeading: 'Check signed SLA and issue notification',
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				question: 'my-question',
				backLink: '/PLAN-12345/some-journey/some-section/my-question',
				notificationPreviewTemplate: 'my-question-complete',
				submitButtonText: 'Confirm and issue notification',
				notificationTextLPA: undefined,
				answersToReview: [
					{
						name: 'Date uploaded',
						value: null,
						url: '/case/PLAN-12345/some-journey/some-section/sla-received-date'
					},
					{
						name: 'Signed SLA document 1',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileAGuid">fileA.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/signed-sla'
					},
					{
						name: 'Signed SLA document 2',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileBGuid">fileB.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/signed-sla'
					}
				]
			}
		);
	});
	it('SignedSLASubmissionCheck.generateDataForPage with received date set', async () => {
		MockService.db.gateway1Info.findUnique.mock.mockImplementation(async () => {
			return {
				slaSentDate: null,
				slaReceivedDate: new Date(2026, 0, 1)
			};
		});
		await testGenerateDataForPage(
			new SignedSLASubmissionCheck(),
			{
				caseId: '123456',
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				questionUrl: 'my-question',
				originalUrl: '/PLAN-12345/some-journey/some-section/my-question/check',
				service: MockService,
				uploadedFiles: [
					{ fileName: 'fileA.txt', metadata: { documentGuid: 'fileAGuid' } },
					{ fileName: 'fileB.txt', metadata: { documentGuid: 'fileBGuid' } }
				]
			},
			{
				titleHeading: 'Check signed SLA and issue notification',
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				question: 'my-question',
				backLink: '/PLAN-12345/some-journey/some-section/my-question',
				notificationPreviewTemplate: 'my-question',
				submitButtonText: 'Confirm and issue notification',
				notificationTextLPA: undefined,
				answersToReview: [
					{
						name: 'Date uploaded',
						value: '1 January 2026',
						url: '/case/PLAN-12345/some-journey/some-section/sla-received-date'
					},
					{
						name: 'Signed SLA document 1',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileAGuid">fileA.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/signed-sla'
					},
					{
						name: 'Signed SLA document 2',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileBGuid">fileB.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/signed-sla'
					}
				]
			}
		);
	});
});

describe('Test ExaminationReportSubmissionCheck', () => {
	const args = (uploadedFiles: unknown[]) => [
		'123456',
		'PLAN-12345',
		'examination',
		'outcome',
		'examination-report',
		'/PLAN-12345/examination/outcome/examination-report/check',
		MockService,
		uploadedFiles
	];

	it('shows the plan outcome and date for the first report', async () => {
		MockService.db.examinationInfo.findUnique.mock.mockImplementation(async () => ({
			soundUnsoundDate: null,
			isSound: 'sound-with-modifications'
		}));

		const data = await new ExaminationReportSubmissionCheck().generateDataForPage(
			...(args([
				{ fileName: 'someFile.txt', metadata: { documentGuid: 'someGuid' }, dateCreated: new Date(2026, 0, 1) }
			]) as [string, string, string, string, string, string, any, any])
		);

		assert.deepEqual(
			data.answersToReview.map((field) => [field.name, field.value]),
			[
				['Outcome', 'Sound with modifications'],
				['Date', '1 January 2026'],
				[
					'examination report 1',
					'<a class="govuk-link" href="/case/PLAN-12345/download-case-document/someGuid">someFile.txt</a>'
				]
			]
		);
		assert.deepEqual(data.answersToReview[1], {
			name: 'Date',
			value: '1 January 2026',
			url: '/case/PLAN-12345/examination/outcome/sound-unsound-date?returnTo=check'
		});
		assert.equal(data.backLink, '/PLAN-12345/examination/outcome/examination-report?returnTo=check');
	});

	it('keeps the initial check page after its date is changed', async () => {
		MockService.db.examinationInfo.findUnique.mock.mockImplementation(async () => ({
			soundUnsoundDate: new Date(2026, 0, 3),
			isSound: 'sound'
		}));
		MockService.db.caseHistory.findFirst.mock.mockImplementation(async () => ({ id: 'manual-date-history' }));
		const checkPageUrl = '/PLAN-12345/examination/outcome/examination-report/check?returnTo=check';

		const data = await new ExaminationReportSubmissionCheck().generateDataForPage(
			'123456',
			'PLAN-12345',
			'examination',
			'outcome',
			'examination-report',
			checkPageUrl,
			MockService as any,
			[{ fileName: 'someFile.txt', metadata: { documentGuid: 'someGuid' }, dateCreated: new Date(2026, 0, 1) }]
		);

		assert.deepEqual(
			data.answersToReview.map((field) => [field.name, field.value]),
			[
				['Outcome', 'Sound'],
				['Date', '3 January 2026'],
				[
					'examination report 1',
					'<a class="govuk-link" href="/case/PLAN-12345/download-case-document/someGuid">someFile.txt</a>'
				]
			]
		);
		assert.equal(data.backLink, '/PLAN-12345/examination/outcome/examination-report?returnTo=check');
	});

	it('shows today as the date for an additional report when it was not manually set', async () => {
		MockService.db.examinationInfo.findUnique.mock.mockImplementation(async () => ({
			soundUnsoundDate: new Date(2026, 0, 1),
			isSound: 'sound'
		}));
		MockService.db.caseHistory.findFirst.mock.mockImplementation(async () => null);
		const today = new Intl.DateTimeFormat('en-GB', {
			day: 'numeric',
			month: 'long',
			timeZone: 'Europe/London',
			year: 'numeric'
		}).format(new Date());

		const data = await new ExaminationReportSubmissionCheck().generateDataForPage(
			...(args([
				{ fileName: 'someFile.txt', metadata: { documentGuid: 'someGuid' }, dateCreated: new Date(2026, 0, 2) }
			]) as [string, string, string, string, string, string, any, any])
		);

		assert.equal(data.titleHeading, 'Check documents and send notification');
		assert.equal(data.backLink, '/PLAN-12345/examination/outcome/examination-report?returnTo=check');
		assert.deepEqual(
			data.answersToReview.map((field) => [field.name, field.value]),
			[
				['Outcome', 'Sound'],
				['Date', today],
				[
					'examination report 1',
					'<a class="govuk-link" href="/case/PLAN-12345/download-case-document/someGuid">someFile.txt</a>'
				]
			]
		);
	});

	it('preserves a manually entered date on an additional report Check page', async () => {
		const manuallyEnteredDate = new Date(2026, 0, 1);
		MockService.db.examinationInfo.findUnique.mock.mockImplementation(async () => ({
			soundUnsoundDate: manuallyEnteredDate,
			isSound: 'sound'
		}));
		MockService.db.caseHistory.findFirst.mock.mockImplementation(async () => ({ id: 'manual-date-history' }));

		const data = await new ExaminationReportSubmissionCheck().generateDataForPage(
			...(args([
				{ fileName: 'someFile.txt', metadata: { documentGuid: 'someGuid' }, dateCreated: new Date(2026, 0, 2) }
			]) as [string, string, string, string, string, string, any, any])
		);

		assert.deepEqual(
			data.answersToReview.map((field) => [field.name, field.value]),
			[
				['Outcome', 'Sound'],
				['Date', '1 January 2026'],
				[
					'examination report 1',
					'<a class="govuk-link" href="/case/PLAN-12345/download-case-document/someGuid">someFile.txt</a>'
				]
			]
		);
	});
});

describe('Test Gateway2ReportSubmissionCheck', () => {
	it('Gateway2ReportSubmissionCheck.generateDataForPage with no existing data', async () => {
		MockService.db.gateway2Info.findUnique.mock.mockImplementation(async () => {
			return {
				reportIssuedDate: null
			};
		});
		await testGenerateDataForPage(
			new Gateway2ReportSubmissionCheck(),
			{
				caseId: '123456',
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				questionUrl: 'my-question',
				originalUrl: '/PLAN-12345/some-journey/some-section/my-question/check',
				service: MockService,
				uploadedFiles: [
					{ fileName: 'fileA.txt', metadata: { documentGuid: 'fileAGuid' }, dateCreated: new Date(2026, 0, 1) },
					{ fileName: 'fileB.txt', metadata: { documentGuid: 'fileBGuid' }, dateCreated: new Date(2026, 0, 2) }
				]
			},
			{
				titleHeading: 'Check Gateway 2 report details and issue notification',
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				question: 'my-question',
				backLink: '/PLAN-12345/some-journey/some-section/my-question',
				notificationPreviewTemplate: 'my-question',
				submitButtonText: 'Issue report',
				notificationTextLPA: "We'll send a notification to the LPA to tell them that the report is available",
				answersToReview: [
					{
						name: 'Date uploaded',
						value: '1 January 2026',
						url: undefined
					},
					{
						name: 'Gateway 2 report 1',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileAGuid">fileA.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/gateway-2-report'
					},
					{
						name: 'Gateway 2 report 2',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileBGuid">fileB.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/gateway-2-report'
					}
				]
			}
		);
	});
	it('Gateway2ReportSubmissionCheck.generateDataForPage with existing data', async () => {
		MockService.db.gateway2Info.findUnique.mock.mockImplementation(async () => {
			return {
				reportIssuedDate: new Date(2026, 0, 1)
			};
		});
		await testGenerateDataForPage(
			new Gateway2ReportSubmissionCheck(),
			{
				caseId: '123456',
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				questionUrl: 'my-question',
				originalUrl: '/PLAN-12345/some-journey/some-section/my-question/check',
				service: MockService,
				uploadedFiles: [
					{ fileName: 'fileA.txt', metadata: { documentGuid: 'fileAGuid' }, dateCreated: new Date(2026, 0, 1) },
					{ fileName: 'fileB.txt', metadata: { documentGuid: 'fileBGuid' }, dateCreated: new Date(2026, 0, 2) }
				]
			},
			{
				titleHeading: 'Check Gateway 2 report details and issue notification',
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				question: 'my-question',
				backLink: '/PLAN-12345/some-journey/some-section/my-question',
				notificationPreviewTemplate: 'my-question-complete',
				submitButtonText: 'Issue report',
				notificationTextLPA: "We'll send a notification to the LPA to tell them that the report is available",
				answersToReview: [
					{
						name: 'Date uploaded',
						value: '1 January 2026',
						url: undefined
					},
					{
						name: 'Gateway 2 report 1',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileAGuid">fileA.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/gateway-2-report'
					},
					{
						name: 'Gateway 2 report 2',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileBGuid">fileB.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/gateway-2-report'
					}
				]
			}
		);
	});
});

describe('Test Gateway3SubmissionCheck', () => {
	it('Gateway3SubmissionCheck.generateDataForPage with no existing data for decision 1', async () => {
		MockService.db.gateway3Info.findUnique.mock.mockImplementation(async () => {
			return {
				submissions: [
					{
						id: 'someId-1',
						decision: '1',
						completionDate: null,
						gateway3InfoId: undefined
					}
				]
			};
		});
		await testGenerateDataForPage(
			new Gateway3SubmissionCheck(),
			{
				caseId: '123456',
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				questionUrl: 'my-question-1',
				originalUrl: '/case/PLAN-12345/some-journey/some-section/my-question/check',
				service: MockService,
				uploadedFiles: [
					{ fileName: 'fileA.txt', metadata: { documentGuid: 'fileAGuid' } },
					{ fileName: 'fileB.txt', metadata: { documentGuid: 'fileBGuid' } }
				]
			},
			{
				titleHeading: 'Check gateway 3 decision and report details',
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				question: 'my-question-1',
				backLink: '/case/PLAN-12345/gateway-3',
				notificationPreviewTemplate: 'gateway-3-document',
				submitButtonText: 'Issue decision',
				notificationTextLPA: undefined,
				answersToReview: [
					{
						name: 'Outcome',
						value: 'Proceed to examination',
						url: '/case/PLAN-12345/some-journey/some-section/gateway-3-decision-1'
					},
					{
						name: 'Gateway 3 discussion document 1',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileAGuid">fileA.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/gateway-3-document-1'
					},
					{
						name: 'Gateway 3 discussion document 2',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileBGuid">fileB.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/gateway-3-document-1'
					}
				]
			}
		);
	});
	it('Gateway3SubmissionCheck.generateDataForPage with no existing data for decision 2', async () => {
		MockService.db.gateway3Info.findUnique.mock.mockImplementation(async () => {
			return {
				submissions: [
					{
						id: 'someId-1',
						decision: '2',
						completionDate: null,
						gateway3InfoId: undefined
					}
				]
			};
		});
		await testGenerateDataForPage(
			new Gateway3SubmissionCheck(),
			{
				caseId: '123456',
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				questionUrl: 'my-question-1',
				originalUrl: '/case/PLAN-12345/some-journey/some-section/my-question/check',
				service: MockService,
				uploadedFiles: [
					{ fileName: 'fileA.txt', metadata: { documentGuid: 'fileAGuid' } },
					{ fileName: 'fileB.txt', metadata: { documentGuid: 'fileBGuid' } }
				]
			},
			{
				titleHeading: 'Check gateway 3 decision and report details',
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				question: 'my-question-1',
				backLink: '/case/PLAN-12345/gateway-3',
				notificationPreviewTemplate: 'gateway-3-document',
				submitButtonText: 'Issue decision',
				notificationTextLPA: undefined,
				answersToReview: [
					{
						name: 'Outcome',
						value: 'Resubmission required',
						url: '/case/PLAN-12345/some-journey/some-section/gateway-3-decision-1'
					},
					{
						name: 'Gateway 3 discussion document 1',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileAGuid">fileA.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/gateway-3-document-1'
					},
					{
						name: 'Gateway 3 discussion document 2',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileBGuid">fileB.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/gateway-3-document-1'
					}
				]
			}
		);
	});
	it('Gateway3SubmissionCheck.generateDataForPage with existing data', async () => {
		MockService.db.gateway3Info.findUnique.mock.mockImplementation(async () => {
			return {
				submissions: [
					{
						id: 'someId-1',
						decision: '1',
						completionDate: new Date(2026, 0, 1),
						gateway3InfoId: undefined
					}
				]
			};
		});
		await testGenerateDataForPage(
			new Gateway3SubmissionCheck(),
			{
				caseId: '123456',
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				questionUrl: 'my-question-1',
				originalUrl: '/case/PLAN-12345/some-journey/some-section/my-question/check',
				service: MockService,
				uploadedFiles: [
					{ fileName: 'fileA.txt', metadata: { documentGuid: 'fileAGuid' } },
					{ fileName: 'fileB.txt', metadata: { documentGuid: 'fileBGuid' } }
				]
			},
			{
				titleHeading: 'Check gateway 3 decision and report details',
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				question: 'my-question-1',
				backLink: '/case/PLAN-12345/gateway-3', // Should go back to the journey
				notificationPreviewTemplate: 'gateway-3-document-complete',
				submitButtonText: 'Issue decision',
				notificationTextLPA: undefined,
				answersToReview: [
					{
						name: 'Outcome',
						value: 'Proceed to examination',
						url: '/case/PLAN-12345/some-journey/some-section/gateway-3-decision-1'
					},
					{
						name: 'Gateway 3 discussion document 1',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileAGuid">fileA.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/gateway-3-document-1'
					},
					{
						name: 'Gateway 3 discussion document 2',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileBGuid">fileB.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/gateway-3-document-1'
					}
				]
			}
		);
	});
	it('Gateway3SubmissionCheck.generateDataForPage with no decision', async () => {
		MockService.db.gateway3Info.findUnique.mock.mockImplementation(async () => {
			return {
				submissions: [
					{
						id: 'someId-1',
						decision: '1',
						completionDate: null,
						gateway3InfoId: null
					}
				]
			};
		});
		// Should raise an error if the decision cannot be found
		await assert.rejects(async () =>
			testGenerateDataForPage(
				new Gateway3SubmissionCheck(),
				{
					caseId: '123456',
					caseReference: 'PLAN-12345',
					journeyId: 'some-journey',
					section: 'some-section',
					questionUrl: 'my-question-1',
					originalUrl: '/PLAN-12345/some-journey/some-section/my-question/check',
					service: MockService,
					uploadedFiles: [
						{ fileName: 'fileA.txt', metadata: { documentGuid: 'fileAGuid' } },
						{ fileName: 'fileB.txt', metadata: { documentGuid: 'fileBGuid' } }
					]
				},
				{
					titleHeading: 'Check gateway 3 decision and report details',
					uploadedFiles: ['fileA.txt', 'fileB.txt'],
					caseReference: 'PLAN-12345',
					journeyId: 'some-journey',
					section: 'some-section',
					question: 'my-question-1',
					backLink: '/PLAN-12345/some-journey',
					notificationPreviewTemplate: 'gateway-3-document',
					submitButtonText: 'Issue decision',
					answersToReview: [
						{
							name: 'Outcome',
							value: null,
							url: 'gateway-3-decision-1'
						}
					]
				}
			)
		);
	});
	it('Gateway3SubmissionCheck.generateDataForPage with undefined decision number', async () => {
		MockService.db.gateway3Info.findUnique.mock.mockImplementation(async () => {
			return {
				submissions: [
					{
						id: 'someId-1',
						decision: '999',
						completionDate: null,
						gateway3InfoId: undefined
					}
				]
			};
		});
		await assert.rejects(async () =>
			testGenerateDataForPage(
				new Gateway3SubmissionCheck(),
				{
					caseId: '123456',
					caseReference: 'PLAN-12345',
					journeyId: 'some-journey',
					section: 'some-section',
					questionUrl: 'my-question-1',
					originalUrl: '/PLAN-12345/some-journey/some-section/my-question/check',
					service: MockService,
					uploadedFiles: [
						{ fileName: 'fileA.txt', metadata: { documentGuid: 'fileAGuid' } },
						{ fileName: 'fileB.txt', metadata: { documentGuid: 'fileBGuid' } }
					]
				},
				{
					titleHeading: 'Check gateway 3 decision and report details',
					caseReference: 'PLAN-12345',
					journeyId: 'some-journey',
					section: 'some-section',
					question: 'my-question',
					backLink: '/PLAN-12345/some-journey',
					notificationPreviewTemplate: 'gateway-3-document',
					submitButtonText: 'Issue decision',
					answersToReview: [
						{
							name: 'Outcome',
							value: null,
							url: '/case/PLAN-12345/some-journey/some-section/gateway-3-decision'
						},
						{
							name: 'Gateway 3 discussion document 1',
							value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileAGuid">fileA.txt</a>',
							url: '/case/PLAN-12345/some-journey/some-section/gateway-2-workshop-documents'
						},
						{
							name: 'Gateway 3 discussion document 2',
							value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileBGuid">fileB.txt</a>',
							url: '/case/PLAN-12345/some-journey/some-section/gateway-2-workshop-documents'
						}
					]
				}
			)
		);
	});
});

describe('Test Gateway2WorkshopDocumentsSubmissionCheck', () => {
	it('Gateway2WorkshopDocumentsSubmissionCheck.generateDataForPage with no existing data', async () => {
		MockService.db.gateway2Info.findUnique.mock.mockImplementation(async () => {
			return {
				workshopDocumentUploadedDate: null
			};
		});
		await testGenerateDataForPage(
			new Gateway2WorkshopDocumentsSubmissionCheck(),
			{
				caseId: '123456',
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				questionUrl: 'my-question',
				originalUrl: '/PLAN-12345/some-journey/some-section/my-question/check',
				service: MockService,
				uploadedFiles: [
					{ fileName: 'fileA.txt', metadata: { documentGuid: 'fileAGuid' } },
					{ fileName: 'fileB.txt', metadata: { documentGuid: 'fileBGuid' } }
				]
			},
			{
				titleHeading: 'Check workshop documents and issue notification',
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				question: 'my-question',
				backLink: '/PLAN-12345/some-journey/some-section/my-question',
				notificationPreviewTemplate: 'my-question',
				submitButtonText: 'Issue documents',
				notificationTextLPA:
					"We'll send a notification to the LPA to tell them that the workshop documents are available.",
				answersToReview: [
					{
						name: 'Date uploaded',
						value: null,
						url: undefined
					},
					{
						name: 'Workshop documents 1',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileAGuid">fileA.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/gateway-2-workshop-documents'
					},
					{
						name: 'Workshop documents 2',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileBGuid">fileB.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/gateway-2-workshop-documents'
					}
				]
			}
		);
	});
	it('Gateway2WorkshopDocumentsSubmissionCheck.generateDataForPage with existing data', async () => {
		MockService.db.gateway2Info.findUnique.mock.mockImplementation(async () => {
			return {
				workshopDocumentUploadedDate: new Date(2026, 0, 1)
			};
		});
		await testGenerateDataForPage(
			new Gateway2WorkshopDocumentsSubmissionCheck(),
			{
				caseId: '123456',
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				questionUrl: 'my-question',
				originalUrl: '/PLAN-12345/some-journey/some-section/my-question/check',
				service: MockService,
				uploadedFiles: [
					{ fileName: 'fileA.txt', metadata: { documentGuid: 'fileAGuid' } },
					{ fileName: 'fileB.txt', metadata: { documentGuid: 'fileBGuid' } }
				]
			},
			{
				titleHeading: 'Check workshop documents and issue notification',
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				question: 'my-question',
				backLink: '/PLAN-12345/some-journey/some-section/my-question',
				notificationPreviewTemplate: 'my-question-complete',
				submitButtonText: 'Issue documents',
				notificationTextLPA:
					"We'll send a notification to the LPA to tell them that the workshop documents are available.",
				answersToReview: [
					{
						name: 'Date uploaded',
						value: null,
						url: undefined
					},
					{
						name: 'Workshop documents 1',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileAGuid">fileA.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/gateway-2-workshop-documents'
					},
					{
						name: 'Workshop documents 2',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileBGuid">fileB.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/gateway-2-workshop-documents'
					}
				]
			}
		);
	});
});

describe('Test Gateway2DocumentSubmissionCheck', () => {
	it('Gateway2WorkshopDocumentsSubmissionCheck.generateDataForPage with no existing data', async () => {
		MockService.db.gateway2Info.findUnique.mock.mockImplementation(async () => {
			return {
				workshopDocumentUploadedDate: null
			};
		});
		await testGenerateDataForPage(
			new Gateway2WorkshopDocumentsSubmissionCheck(),
			{
				caseId: '123456',
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				questionUrl: 'my-question',
				originalUrl: '/PLAN-12345/some-journey/some-section/my-question/check',
				service: MockService,
				uploadedFiles: [
					{ fileName: 'fileA.txt', metadata: { documentGuid: 'fileAGuid' } },
					{ fileName: 'fileB.txt', metadata: { documentGuid: 'fileBGuid' } }
				]
			},
			{
				titleHeading: 'Check workshop documents and issue notification',
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				question: 'my-question',
				backLink: '/PLAN-12345/some-journey/some-section/my-question',
				notificationPreviewTemplate: 'my-question',
				submitButtonText: 'Issue documents',
				notificationTextLPA:
					"We'll send a notification to the LPA to tell them that the workshop documents are available.",
				answersToReview: [
					{
						name: 'Date uploaded',
						value: null,
						url: undefined
					},
					{
						name: 'Workshop documents 1',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileAGuid">fileA.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/gateway-2-workshop-documents'
					},
					{
						name: 'Workshop documents 2',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileBGuid">fileB.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/gateway-2-workshop-documents'
					}
				]
			}
		);
	});
	it('generates submission check data when no documents exist', async () => {
		MockService.db.document.findMany.mock.mockImplementation(async () => []);

		const submissionCheck = new Gateway2DocumentSubmissionCheck();

		const actualResult = await submissionCheck.generateDataForPage(
			'123456',
			'PLAN-12345',
			'some-journey',
			'some-section',
			'my-question',
			'/case/PLAN-12345/some-journey/some-section/my-question/check',
			MockService as any,
			[],
			'Covering letter',
			[]
		);

		assert.deepEqual(actualResult, {
			titleHeading: 'Check document',
			caseReference: 'PLAN-12345',
			journeyId: 'some-journey',
			section: 'some-section',
			question: 'my-question',
			backLink: '/case/PLAN-12345/gateway-2/gateway-2/gateway2Documents',
			submitButtonText: 'Upload document',
			notificationTextLPA: undefined,
			answersToReview: [
				{
					name: 'Section',
					value: 'Covering letter',
					url: undefined
				},
				{
					name: 'Covering letter documents',
					value: 'Not provided',
					url: '/case/PLAN-12345/some-journey/some-section/my-question'
				}
			]
		});
	});
});

class TestableSubmissionCheck extends SubmissionCheck {
	public async generateDataForPage(): Promise<SubmissionCheckData> {
		throw new Error('Not implemented');
	}

	public callFormatDocuments(...args: Parameters<SubmissionCheck['formatDocuments']>) {
		return this.formatDocuments(...args);
	}
}

describe('SubmissionCheck.formatDocuments', () => {
	const files = [
		{ fileName: 'fileA.txt', metadata: { documentGuid: 'fileAGuid' } },
		{ fileName: 'fileB.txt', metadata: { documentGuid: 'fileBGuid' } }
	] as any[];

	it('numbers each document using the given label', () => {
		const result = new TestableSubmissionCheck().callFormatDocuments(
			files,
			'/download',
			'/change',
			undefined,
			'Signed SLA document'
		);
		assert.deepEqual(
			result.map((row) => row.name),
			['Signed SLA document 1', 'Signed SLA document 2']
		);
	});

	it('falls back to "Document" when no label is given', () => {
		const result = new TestableSubmissionCheck().callFormatDocuments(files, '/download', '/change');
		assert.deepEqual(
			result.map((row) => row.name),
			['Document 1', 'Document 2']
		);
	});

	it('does not add leading or trailing whitespace to the label', () => {
		const result = new TestableSubmissionCheck().callFormatDocuments(files, '/download', '/change', undefined, 'MIQ');
		for (const row of result) {
			assert.equal(row.name, row.name.trim());
		}
	});

	it('appends the query string to the change url and links each file to its download url', () => {
		const result = new TestableSubmissionCheck().callFormatDocuments(
			files,
			'/download',
			'/change',
			'returnTo=check',
			'MIQ'
		);
		assert.deepEqual(result[0], {
			name: 'MIQ 1',
			value: '<a class="govuk-link" href="/download/fileAGuid">fileA.txt</a>',
			url: '/change?returnTo=check'
		});
	});

	it('returns no rows when there are no uploaded files', () => {
		assert.deepEqual(
			new TestableSubmissionCheck().callFormatDocuments([], '/download', '/change', undefined, 'MIQ'),
			[]
		);
	});

	it('throws when a file has no documentGuid', () => {
		assert.throws(
			() =>
				new TestableSubmissionCheck().callFormatDocuments(
					[{ fileName: 'noGuid.txt', path: 'some/path', metadata: {} }] as any[],
					'/download',
					'/change',
					undefined,
					'MIQ'
				),
			/documentGuid is missing for document with name noGuid.txt, path some\/path/
		);
	});
});

describe('Test MiqsSubmissionCheck', () => {
	it('labels each uploaded document as an MIQ and returns to the check page on change', async () => {
		const data = await new MiqsSubmissionCheck().generateDataForPage(
			'123456',
			'PLAN-12345',
			'examination',
			'some-section',
			'miqs',
			'/case/PLAN-12345/examination/some-section/miqs/check',
			MockService as any,
			[
				{ fileName: 'fileA.txt', metadata: { documentGuid: 'fileAGuid' } },
				{ fileName: 'fileB.txt', metadata: { documentGuid: 'fileBGuid' } }
			] as any[]
		);

		assert.equal(data.titleHeading, 'Check MIQ documents and send notification');
		assert.equal(data.backLink, '/case/PLAN-12345/examination/some-section/miqs');
		assert.deepEqual(data.answersToReview, [
			{
				name: 'MIQ 1',
				value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileAGuid">fileA.txt</a>',
				url: '/case/PLAN-12345/examination/some-section/miqs?returnTo=check'
			},
			{
				name: 'MIQ 2',
				value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileBGuid">fileB.txt</a>',
				url: '/case/PLAN-12345/examination/some-section/miqs?returnTo=check'
			}
		]);
	});
});

describe('Gateway2DocumentSubmissionCheck document labels', () => {
	it('names the documents row after the question title and lists existing documents', async () => {
		MockService.db.document.findMany.mock.mockImplementation(async () => [
			{
				guid: 'guid-1',
				name: 'PLAN-12345/covering-letter/0b7b6f4e-1111-2222-3333-444455556666-letter.pdf'
			}
		]);

		const data = await new Gateway2DocumentSubmissionCheck().generateDataForPage(
			'case-id',
			'PLAN-12345',
			'gateway-2',
			'documents',
			'covering-letter',
			'/case/PLAN-12345/gateway-2/documents/covering-letter/check',
			MockService as never,
			[],
			'Covering letter'
		);

		assert.deepEqual(data.answersToReview[1], {
			name: 'Covering letter documents',
			value: [{ name: 'letter.pdf', url: '/case/PLAN-12345/download-case-document/guid-1' }],
			url: '/case/PLAN-12345/gateway-2/documents/covering-letter'
		});
	});

	it('throws when no question title is given', async () => {
		await assert.rejects(
			() =>
				new Gateway2DocumentSubmissionCheck().generateDataForPage(
					'case-id',
					'PLAN-12345',
					'gateway-2',
					'documents',
					'covering-letter',
					'/case/PLAN-12345/gateway-2/documents/covering-letter/check',
					MockService as never,
					[]
				),
			/Could not find a title for Gateway 2 document 'covering-letter'/
		);
	});
});

describe('submit-documents-check-your-answers document list rendering', () => {
	const baseViewData = {
		caseReference: 'PLAN-123456',
		config: { headerTitle: 'Manage', footerLinks: [] },
		navigation: [],
		layoutTemplate: 'views/layouts/main.njk'
	};

	it('renders a list of document links for any row whose value is an array', () => {
		const html = configureNunjucks().render('views/layouts/submit-documents-check-your-answers.njk', {
			...baseViewData,
			answersToReview: [
				{
					name: 'Covering letter documents',
					value: [
						{ name: 'first.pdf', url: '/download/first' },
						{ name: 'second.pdf', url: '/download/second' }
					],
					url: '/change'
				}
			]
		});
		assert.match(html, /Covering letter documents/);
		assert.match(html, /<a class="govuk-link" href="\/download\/first">\s*first\.pdf\s*<\/a>/);
		assert.match(html, /<a class="govuk-link" href="\/download\/second">\s*second\.pdf\s*<\/a>/);
	});

	it('renders string values as-is rather than iterating over their characters', () => {
		const html = configureNunjucks().render('views/layouts/submit-documents-check-your-answers.njk', {
			...baseViewData,
			answersToReview: [{ name: 'Covering letter documents', value: 'Not provided', url: '/change' }]
		});
		assert.match(html, /<dd class="govuk-summary-list__value">\s*Not provided\s*<\/dd>/);
	});
});
