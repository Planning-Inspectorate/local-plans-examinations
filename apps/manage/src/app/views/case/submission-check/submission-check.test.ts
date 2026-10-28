import { SubmissionCheck, type SubmissionCheckData } from './submission-check.ts';
import { SignedSLASubmissionCheck } from './signed-sla-submission-check.ts';
import { Gateway2ReportSubmissionCheck } from './gateway-2-report-submission-check.ts';
import { Gateway2DocumentSubmissionCheck } from './gateway-2-document-submission-check.ts';
import { Gateway2WorkshopDocumentsSubmissionCheck } from './gateway-2-workshop-documents-submission-check.ts';
import { Gateway3SubmissionCheck } from './gateway-3-submission-check.ts';
import { ExaminationReportSubmissionCheck } from './examination-report-submission-check.ts';
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
		assert.equal(data.backLink, '/case/PLAN-123456/gateway-2/documents/covering-letter');
		assert.deepEqual(data.answersToReview, [
			{ name: 'Section', value: 'Covering letter', url: undefined },
			{
				name: 'Document 1',
				value:
					'<a class="govuk-link" >letter.pdf</a> <strong class="govuk-tag govuk-tag--yellow">Virus scanning</strong>',
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
						name: 'Document 1',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileAGuid">fileA.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/signed-sla'
					},
					{
						name: 'Document 2',
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
						name: 'Document 1',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileAGuid">fileA.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/signed-sla'
					},
					{
						name: 'Document 2',
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
						name: 'Document 1',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileAGuid">fileA.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/signed-sla'
					},
					{
						name: 'Document 2',
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
				['Document 1', '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/someGuid">someFile.txt</a>']
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
				['Document 1', '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/someGuid">someFile.txt</a>']
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
				['Document 1', '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/someGuid">someFile.txt</a>']
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
				['Document 1', '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/someGuid">someFile.txt</a>']
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
						name: 'Document 1',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileAGuid">fileA.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/gateway-2-report'
					},
					{
						name: 'Document 2',
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
						name: 'Document 1',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileAGuid">fileA.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/gateway-2-report'
					},
					{
						name: 'Document 2',
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
						name: 'Document 1',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileAGuid">fileA.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/gateway-3-document-1'
					},
					{
						name: 'Document 2',
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
						name: 'Document 1',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileAGuid">fileA.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/gateway-3-document-1'
					},
					{
						name: 'Document 2',
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
						name: 'Document 1',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileAGuid">fileA.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/gateway-3-document-1'
					},
					{
						name: 'Document 2',
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
					additionalFields: [
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
							name: 'Document 1',
							value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileAGuid">fileA.txt</a>',
							url: '/case/PLAN-12345/some-journey/some-section/gateway-2-workshop-documents'
						},
						{
							name: 'Document 2',
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
						name: 'Document 1',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileAGuid">fileA.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/gateway-2-workshop-documents'
					},
					{
						name: 'Document 2',
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
						name: 'Document 1',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileAGuid">fileA.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/gateway-2-workshop-documents'
					},
					{
						name: 'Document 2',
						value: '<a class="govuk-link" href="/case/PLAN-12345/download-case-document/fileBGuid">fileB.txt</a>',
						url: '/case/PLAN-12345/some-journey/some-section/gateway-2-workshop-documents'
					}
				]
			}
		);
	});
});

describe('Test Gateway2DocumentSubmissionCheck', () => {
	it('generates submission check data when documents exist', async () => {
		const documents = [
			{
				guid: 'document-123',
				name: 'Test1.pdf'
			},
			{
				guid: 'document-456',
				name: 'Test2.pdf'
			}
		];

		MockService.db.document.findMany.mock.mockImplementation(async () => documents);

		const submissionCheck = new Gateway2DocumentSubmissionCheck();

		const actualResult = await submissionCheck.generateDataForPage(
			'123456',
			'PLAN/12345',
			'some-journey',
			'some-section',
			'my-question',
			'/case/PLAN-12345/some-journey/some-section/my-question/check',
			MockService as any,
			['uploaded-file.pdf'],
			'Gateway 2 documents',
			[]
		);

		assert.deepEqual(actualResult, {
			titleHeading: 'Check document',
			uploadedFiles: ['uploaded-file.pdf'],
			caseReference: 'PLAN/12345',
			journeyId: 'some-journey',
			section: 'some-section',
			question: 'my-question',
			backLink: '/case/PLAN-12345/gateway-2/gateway-2/gateway2Documents',
			submitButtonText: 'Upload document',
			notificationTextLPA: undefined,
			additionalFields: [
				{
					name: 'Section',
					value: 'Gateway 2 documents',
					url: ''
				},
				{
					name: 'Documents',
					value: 'Test1.pdf, Test2.pdf',
					url: 'my-question'
				}
			],
			allDocuments: [
				{
					name: 'Test1.pdf',
					url: '/case/PLAN%2F12345/download-case-document/document-123'
				},
				{
					name: 'Test2.pdf',
					url: '/case/PLAN%2F12345/download-case-document/document-456'
				}
			]
		});
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
			'Gateway 2 documents',
			[]
		);

		assert.deepEqual(actualResult, {
			titleHeading: 'Check document',
			uploadedFiles: [],
			caseReference: 'PLAN-12345',
			journeyId: 'some-journey',
			section: 'some-section',
			question: 'my-question',
			backLink: '/case/PLAN-12345/gateway-2/gateway-2/gateway2Documents',
			submitButtonText: 'Upload document',
			notificationTextLPA: undefined,
			additionalFields: [
				{
					name: 'Section',
					value: 'Gateway 2 documents',
					url: ''
				},
				{
					name: 'Documents',
					value: 'Not provided',
					url: 'my-question'
				}
			],
			allDocuments: []
		});
	});
});
