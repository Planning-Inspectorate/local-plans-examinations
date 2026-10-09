import { SubmissionCheck, type SubmissionCheckData } from './submission-check.ts';
import { SignedSLASubmissionCheck } from './signed-sla-submission-check.ts';
import { Gateway2ReportSubmissionCheck } from './gateway-2-report-submission-check.ts';
import { Gateway3SubmissionCheck } from './gateway-3-submission-check.ts';
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

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
	it('generateDataForPage with no existing data', async () => {
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
	it('generateDataForPage with existing data', async () => {
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
	it('generateDataForPage with received date set', async () => {
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

describe('Test Gateway2ReportSubmissionCheck', () => {
	it('generateDataForPage with no existing data', async () => {
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
	it('generateDataForPage with existing data', async () => {
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
	it('generateDataForPage with no existing data for decision 1', async () => {
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
	it('generateDataForPage with no existing data for decision 2', async () => {
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
	it('generateDataForPage with existing data', async () => {
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
	it('generateDataForPage with no decision', async () => {
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
	it('generateDataForPage with undefined decision number', async () => {
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
