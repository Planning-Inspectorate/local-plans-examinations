import { SubmissionCheck, type SubmissionCheckData } from './submission-check.ts';
import { SignedSLASubmissionCheck } from './signed-sla-submission-check.ts';
import { Gateway2ReportSubmissionCheck } from './gateway-2-report-submission-check.ts';
import { Gateway2WorkshopDocumentsSubmissionCheck } from './gateway-2-workshop-documents-submission-check.ts';
import { Gateway3SubmissionCheck } from './gateway-3-submission-check.ts';
import { ExaminationReportSubmissionCheck } from './examination-report-submission-check.ts';
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { configureNunjucks } from '../../../nunjucks.ts';

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
		}
	}
};

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
				uploadedFiles: ['fileA.txt', 'fileB.txt']
			},
			{
				titleHeading: 'Check signed SLA and issue notification',
				uploadedFiles: ['fileA.txt', 'fileB.txt'],
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				question: 'my-question',
				backLink: '/PLAN-12345/some-journey/some-section/my-question',
				notificationPreviewTemplate: 'my-question',
				submitButtonText: 'Confirm and issue notification',
				notificationTextLPA: undefined,
				additionalFields: [
					{
						name: 'Date uploaded',
						value: null,
						url: 'sla-received-date'
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
				uploadedFiles: ['fileA.txt', 'fileB.txt']
			},
			{
				titleHeading: 'Check signed SLA and issue notification',
				uploadedFiles: ['fileA.txt', 'fileB.txt'],
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				question: 'my-question',
				backLink: '/PLAN-12345/some-journey/some-section/my-question',
				notificationPreviewTemplate: 'my-question-complete',
				submitButtonText: 'Confirm and issue notification',
				notificationTextLPA: undefined,
				additionalFields: [
					{
						name: 'Date uploaded',
						value: null,
						url: 'sla-received-date'
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
				uploadedFiles: ['fileA.txt', 'fileB.txt']
			},
			{
				titleHeading: 'Check signed SLA and issue notification',
				uploadedFiles: ['fileA.txt', 'fileB.txt'],
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				question: 'my-question',
				backLink: '/PLAN-12345/some-journey/some-section/my-question',
				notificationPreviewTemplate: 'my-question',
				submitButtonText: 'Confirm and issue notification',
				notificationTextLPA: undefined,
				additionalFields: [
					{
						name: 'Date uploaded',
						value: '1 January 2026',
						url: 'sla-received-date'
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
			...(args([{ dateCreated: new Date(2026, 0, 1) }]) as [string, string, string, string, string, string, any, any])
		);

		assert.deepEqual(
			data.additionalFields.map((field) => [field.name, field.value]),
			[
				['Outcome', 'Sound with modifications'],
				['Date', '1 January 2026']
			]
		);
		assert.deepEqual(data.additionalFields[1], {
			name: 'Date',
			value: '1 January 2026',
			url: 'sound-unsound-date',
			query: 'returnTo=check'
		});
		assert.equal(data.documentChangeUrl, '/PLAN-12345/examination/outcome/examination-report?returnTo=check');
		assert.equal(data.backLink, data.documentChangeUrl);
		const html = configureNunjucks().render('views/layouts/submit-documents-check-your-answers.njk', {
			...data,
			config: { headerTitle: 'Manage', footerLinks: [] }
		});
		assert.ok(html.includes(`href="${data.documentChangeUrl}">Change`));
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
			[{ dateCreated: new Date(2026, 0, 1) }]
		);

		assert.deepEqual(
			data.additionalFields.map((field) => [field.name, field.value]),
			[
				['Outcome', 'Sound'],
				['Date', '3 January 2026']
			]
		);
		assert.equal(data.documentChangeUrl, '/PLAN-12345/examination/outcome/examination-report?returnTo=check');
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
			...(args([{ dateCreated: new Date(2026, 0, 2) }]) as [string, string, string, string, string, string, any, any])
		);

		assert.equal(data.titleHeading, 'Check documents and send notification');
		assert.equal(data.documentChangeUrl, '/PLAN-12345/examination/outcome/examination-report?returnTo=check');
		assert.deepEqual(
			data.additionalFields.map((field) => [field.name, field.value]),
			[
				['Outcome', 'Sound'],
				['Date', today]
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
			...(args([{ dateCreated: new Date(2026, 0, 2) }]) as [string, string, string, string, string, string, any, any])
		);

		assert.deepEqual(
			data.additionalFields.map((field) => [field.name, field.value]),
			[
				['Outcome', 'Sound'],
				['Date', '1 January 2026']
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
					{ name: 'fileA.txt', dateCreated: new Date(2026, 0, 1) },
					{ name: 'fileB.txt', dateCreated: new Date(2026, 0, 2) }
				]
			},
			{
				titleHeading: 'Check Gateway 2 report details and issue notification',
				uploadedFiles: [
					{ name: 'fileA.txt', dateCreated: new Date(2026, 0, 1) },
					{ name: 'fileB.txt', dateCreated: new Date(2026, 0, 2) }
				],
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				question: 'my-question',
				backLink: '/PLAN-12345/some-journey/some-section/my-question',
				notificationPreviewTemplate: 'my-question',
				submitButtonText: 'Issue report',
				notificationTextLPA: "We'll send a notification to the LPA to tell them that the report is available",
				additionalFields: [
					{
						name: 'Date uploaded',
						value: '1 January 2026',
						url: undefined
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
					{ name: 'fileA.txt', dateCreated: new Date(2026, 0, 1) },
					{ name: 'fileB.txt', dateCreated: new Date(2026, 0, 2) }
				]
			},
			{
				titleHeading: 'Check Gateway 2 report details and issue notification',
				uploadedFiles: [
					{ name: 'fileA.txt', dateCreated: new Date(2026, 0, 1) },
					{ name: 'fileB.txt', dateCreated: new Date(2026, 0, 2) }
				],
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				question: 'my-question',
				backLink: '/PLAN-12345/some-journey/some-section/my-question',
				notificationPreviewTemplate: 'my-question-complete',
				submitButtonText: 'Issue report',
				notificationTextLPA: "We'll send a notification to the LPA to tell them that the report is available",
				additionalFields: [
					{
						name: 'Date uploaded',
						value: '1 January 2026',
						url: undefined
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
				uploadedFiles: ['fileA.txt', 'fileB.txt']
			},
			{
				titleHeading: 'Check gateway 3 decision and report details',
				uploadedFiles: ['fileA.txt', 'fileB.txt'],
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				question: 'my-question-1',
				backLink: '/case/PLAN-12345/gateway-3',
				notificationPreviewTemplate: 'gateway-3-document',
				submitButtonText: 'Issue decision',
				notificationTextLPA: undefined,
				additionalFields: [
					{
						name: 'Outcome',
						value: 'Proceed to examination',
						url: 'gateway-3-decision-1'
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
				uploadedFiles: ['fileA.txt', 'fileB.txt']
			},
			{
				titleHeading: 'Check gateway 3 decision and report details',
				uploadedFiles: ['fileA.txt', 'fileB.txt'],
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				question: 'my-question-1',
				backLink: '/case/PLAN-12345/gateway-3',
				notificationPreviewTemplate: 'gateway-3-document',
				submitButtonText: 'Issue decision',
				notificationTextLPA: undefined,
				additionalFields: [
					{
						name: 'Outcome',
						value: 'Resubmission required',
						url: 'gateway-3-decision-1'
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
				uploadedFiles: ['fileA.txt', 'fileB.txt']
			},
			{
				titleHeading: 'Check gateway 3 decision and report details',
				uploadedFiles: ['fileA.txt', 'fileB.txt'],
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				question: 'my-question-1',
				backLink: '/case/PLAN-12345/gateway-3', // Should go back to the journey
				notificationPreviewTemplate: 'gateway-3-document-complete',
				submitButtonText: 'Issue decision',
				notificationTextLPA: undefined,
				additionalFields: [
					{
						name: 'Outcome',
						value: 'Proceed to examination',
						url: 'gateway-3-decision-1'
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
					uploadedFiles: ['fileA.txt', 'fileB.txt']
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
					uploadedFiles: ['fileA.txt', 'fileB.txt']
				},
				{
					titleHeading: 'Check gateway 3 decision and report details',
					uploadedFiles: ['fileA.txt', 'fileB.txt'],
					caseReference: 'PLAN-12345',
					journeyId: 'some-journey',
					section: 'some-section',
					question: 'my-question',
					backLink: '/PLAN-12345/some-journey',
					notificationPreviewTemplate: 'gateway-3-document',
					submitButtonText: 'Issue decision',
					additionalFields: [
						{
							name: 'Outcome',
							value: null,
							url: 'gateway-3-decision'
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
				uploadedFiles: ['fileA.txt', 'fileB.txt']
			},
			{
				titleHeading: 'Check workshop documents and issue notification',
				uploadedFiles: ['fileA.txt', 'fileB.txt'],
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				question: 'my-question',
				backLink: '/PLAN-12345/some-journey/some-section/my-question',
				notificationPreviewTemplate: 'my-question',
				submitButtonText: 'Issue documents',
				notificationTextLPA:
					"We'll send a notification to the LPA to tell them that the workshop documents are available.",
				additionalFields: [
					{
						name: 'Date uploaded',
						value: null,
						url: undefined
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
				uploadedFiles: ['fileA.txt', 'fileB.txt']
			},
			{
				titleHeading: 'Check workshop documents and issue notification',
				uploadedFiles: ['fileA.txt', 'fileB.txt'],
				caseReference: 'PLAN-12345',
				journeyId: 'some-journey',
				section: 'some-section',
				question: 'my-question',
				backLink: '/PLAN-12345/some-journey/some-section/my-question',
				notificationPreviewTemplate: 'my-question-complete',
				submitButtonText: 'Issue documents',
				notificationTextLPA:
					"We'll send a notification to the LPA to tell them that the workshop documents are available.",
				additionalFields: [
					{
						name: 'Date uploaded',
						value: null,
						url: undefined
					}
				]
			}
		);
	});
});
