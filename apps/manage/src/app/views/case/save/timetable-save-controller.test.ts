import { TimetableSaveController } from './timetable-save-controller.ts';
import { ManageService } from '#service';
import type { Request } from 'express';
import { describe, it, type Mock, mock } from 'node:test';
import assert from 'node:assert/strict';
import { questions } from '../questions.ts';

type MockServiceType = {
	db: {
		case: {
			findUnique: any;
			upsert: any;
		};
		gateway1Info: {
			findUnique: any;
			upsert: any;
		};
		gateway2Info: {
			findUnique: any;
			upsert: any;
		};
		gateway3Info: {
			findUnique: any;
			upsert: any;
		};
		examinationInfo: {
			findUnique: any;
			upsert: any;
		};
		contacts: {
			upsert: any;
		};
		lpas: {
			upsert: any;
		};
		gateway3Submission: {
			updateMany: any;
		};
		planPauseHistory: {
			update: any;
		};
	};
};
function createMockService(): MockServiceType {
	return {
		db: {
			case: {
				findUnique: mock.fn(async () => ({
					id: 'someCaseId',
					gateway2Info: {
						workshops: [{}]
					},
					examinationInfo: {
						hearings: [{}]
					},
					gateway3Info: {
						submissions: [
							{
								id: 'someId',
								decision: undefined,
								completionDate: undefined,
								gateway3InfoId: undefined
							}
						]
					}
				})),
				upsert: mock.fn(async () => ({}))
			},
			gateway1Info: {
				findUnique: mock.fn<() => {}>(),
				upsert: mock.fn(async () => ({}))
			},
			gateway2Info: {
				findUnique: mock.fn<() => {}>(),
				upsert: mock.fn(async () => ({}))
			},
			gateway3Info: {
				findUnique: mock.fn<() => {}>(),
				upsert: mock.fn(async () => ({}))
			},
			examinationInfo: {
				findUnique: mock.fn<() => {}>(),
				upsert: mock.fn(async () => ({}))
			},
			contacts: {
				upsert: mock.fn(async () => ({}))
			},
			lpas: {
				upsert: mock.fn(async () => ({}))
			},
			gateway3Submission: {
				updateMany: mock.fn(async () => ({ count: 1 }))
			},
			planPauseHistory: {
				update: mock.fn(async () => ({}))
			}
		}
	};
}

const mockDate = new Date('2026-01-01T00:00:00.000Z');
mock.timers.enable({
	apis: ['Date'],
	now: mockDate
});

function createController(mockService: MockServiceType, question: string) {
	const req = {
		params: {},
		url: `/timetable/fact-check/${question}`
	} as Request;
	req.params.question = question;
	return new TimetableSaveController(mockService as unknown as ManageService, req, 'caseRef');
}

describe('test TimetableSaveController', () => {
	const timetableGateway3CompletionDateUrl = questions.timetableGateway3CompletionDate.url;

	it('saves a gateway 1 question to Gateway1Info', async () => {
		const mockService = createMockService();
		const answers = { expectedGateway1Date: mockDate };
		const expectedQuery = {
			where: { caseId: 'someCaseId' },
			update: { ...answers },
			create: {
				caseId: 'someCaseId',
				...answers
			}
		};
		await createController(mockService, questions.gateway1ExpectedDate.url).prepareAndSave(answers);
		assert.deepEqual(mockService.db.gateway1Info.upsert.mock.calls[0].arguments.at(0), expectedQuery);
		assert.equal(mockService.db.gateway2Info.upsert.mock.callCount(), 0);
		assert.equal(mockService.db.gateway3Info.upsert.mock.callCount(), 0);
		assert.equal(mockService.db.examinationInfo.upsert.mock.callCount(), 0);
	});
	it('saves a gateway 2 question to Gateway2Info', async () => {
		const mockService = createMockService();
		const answers = { expectedDate: mockDate };
		await createController(mockService, questions.gateway2ExpectedDate.url).prepareAndSave(answers);
		assert.equal(mockService.db.gateway2Info.upsert.mock.callCount(), 1);
		assert.equal(mockService.db.gateway2Info.upsert.mock.calls[0].arguments.at(0).update.expectedDate, mockDate);
		assert.equal(mockService.db.gateway1Info.upsert.mock.callCount(), 0);
		assert.equal(mockService.db.gateway3Info.upsert.mock.callCount(), 0);
	});
	it('maps the timetable gateway 3 dates to the Gateway3Info field names', async () => {
		const mockService = createMockService();
		const actualDate = new Date('2026-02-02T00:00:00.000Z');
		const answers = { gateway3ExpectedDate: mockDate, gateway3ActualDate: actualDate };
		const expectedQuery = {
			where: { caseId: 'someCaseId' },
			update: { expectedDate: mockDate, actualDate },
			create: {
				caseId: 'someCaseId',
				expectedDate: mockDate,
				actualDate
			}
		};
		await createController(mockService, questions.timetableGateway3ExpectedDate.url).prepareAndSave(answers);
		assert.deepEqual(mockService.db.gateway3Info.upsert.mock.calls[0].arguments.at(0), expectedQuery);
		assert.equal(mockService.db.gateway2Info.upsert.mock.callCount(), 0);
	});
	it('only maps the gateway 3 dates that are present', async () => {
		const mockService = createMockService();
		const answers = { gateway3ActualDate: mockDate };
		await createController(mockService, questions.timetableGateway3ActualDate.url).prepareAndSave(answers);
		assert.deepEqual(mockService.db.gateway3Info.upsert.mock.calls[0].arguments.at(0).update, {
			actualDate: mockDate
		});
	});
	it('saves an examination question to ExaminationInfo', async () => {
		const mockService = createMockService();
		const answers = { letterIssueDate: mockDate };
		await createController(mockService, questions.letterIssueDate.url).prepareAndSave(answers);
		assert.equal(mockService.db.examinationInfo.upsert.mock.callCount(), 1);
		assert.equal(mockService.db.examinationInfo.upsert.mock.calls[0].arguments.at(0).update.letterIssueDate, mockDate);
		assert.equal(mockService.db.gateway1Info.upsert.mock.callCount(), 0);
	});
	for (const [model, questionNames] of [
		['gateway1Info', ['noticeOfIntentionPublishDate', 'gateway1ActualDate', 'slaSentDate', 'slaReceivedDate']],
		['gateway2Info', ['gateway2ActualDate', 'reportIssuedDate', 'reportPublishedDate']],
		[
			'examinationInfo',
			[
				'expectedSubmissionForExaminationDate',
				'submissionForExaminationDate',
				'letterSentToMHCLGDate',
				'qaDate',
				'sentToPanelDate',
				'panelResponseSentToInspector',
				'factCheckDateReceivedFromInspector',
				'factCheckDueDate',
				'factCheckActualDate',
				'factCheckReceivedBackFromLPADate',
				'finalReportIssueDate',
				'withdrawnDate',
				'soundUnsoundDate',
				'adoptionDate',
				'approvedForCILDate'
			]
		]
	] as const) {
		for (const name of questionNames) {
			it(`saves ${name} through its configured URL to only ${model}`, async () => {
				const mockService = createMockService();
				const question = questions[name];
				const answers = { [question.fieldName]: mockDate };

				await createController(mockService, question.url).prepareAndSave(answers);

				assert.equal(mockService.db[model].upsert.mock.callCount(), 1);
				assert.deepEqual(mockService.db[model].upsert.mock.calls[0].arguments[0], {
					where: { caseId: 'someCaseId' },
					update: answers,
					create: { caseId: 'someCaseId', ...answers }
				});
				for (const otherModel of ['gateway1Info', 'gateway2Info', 'gateway3Info', 'examinationInfo'] as const) {
					if (otherModel !== model) assert.equal(mockService.db[otherModel].upsert.mock.callCount(), 0);
				}
				assert.equal(mockService.db.gateway3Submission.updateMany.mock.callCount(), 0);
			});
		}
	}
	for (const name of ['timetableGateway3ExpectedDate', 'timetableGateway3ActualDate']) {
		it(`clears only ${name} without resetting the other Gateway 3 date`, async () => {
			const mockService = createMockService();
			const question = questions[name];
			const field = name === 'timetableGateway3ExpectedDate' ? 'expectedDate' : 'actualDate';

			await createController(mockService, question.url).prepareAndSave({ [question.fieldName]: null });

			assert.deepEqual(mockService.db.gateway3Info.upsert.mock.calls[0].arguments[0], {
				where: { caseId: 'someCaseId' },
				update: { [field]: null },
				create: { caseId: 'someCaseId', [field]: null }
			});
			assert.equal(mockService.db.gateway2Info.upsert.mock.callCount(), 0);
			assert.equal(mockService.db.examinationInfo.upsert.mock.callCount(), 0);
		});
	}
	for (const { type, fieldName } of [
		{ type: 'start', fieldName: 'planPauseDate' },
		{ type: 'end', fieldName: 'planPauseEndDate' }
	]) {
		for (const pauseNumber of [1, 2]) {
			it(`updates the ${type} date of pause ${pauseNumber} directly in the database`, async () => {
				const mockService = createMockService();
				const updatedDate = new Date('2026-02-05T00:00:00.000Z');
				const pauses = [2, 1].map((number) => ({
					createdAt: new Date(`2026-01-0${number}T00:00:00.000Z`),
					planPauseDate: new Date(`2026-02-0${number}T00:00:00.000Z`),
					planPauseStartDetails: `Pause ${number} details`,
					planPauseEndDate: new Date(`2026-03-0${number}T00:00:00.000Z`),
					planPauseEndDetails: `Restart ${number} details`
				}));
				mockService.db.case.findUnique = mock.fn(async () => ({
					id: 'someCaseId',
					examinationInfo: { hearings: [], planPauseHistory: pauses }
				}));

				const result = await createController(
					mockService,
					`examination-pause-${type}-date-${pauseNumber}`
				).prepareAndSave({ [`${fieldName}-${pauseNumber}`]: updatedDate });

				const expectedPauses = [pauses[1], pauses[0]].map((pause, index) =>
					index === pauseNumber - 1 ? { ...pause, [fieldName]: updatedDate } : pause
				);
				assert.equal(result.writtenToDB, true);
				assert.equal(mockService.db.examinationInfo.upsert.mock.callCount(), 1);
				assert.deepEqual(mockService.db.examinationInfo.upsert.mock.calls[0].arguments[0], {
					where: { caseId: 'someCaseId' },
					create: { caseId: 'someCaseId', planPauseHistory: { createMany: { data: expectedPauses } } },
					update: { planPauseHistory: { deleteMany: {}, createMany: { data: expectedPauses } } }
				});
				assert.equal(mockService.db.planPauseHistory.update.mock.callCount(), 0);
				assert.equal(mockService.db.gateway1Info.upsert.mock.callCount(), 0);
				assert.equal(mockService.db.gateway2Info.upsert.mock.callCount(), 0);
				assert.equal(mockService.db.gateway3Info.upsert.mock.callCount(), 0);
			});
		}
	}
	it('does not save anything when the question is not a timetable question', async () => {
		const mockService = createMockService();
		await createController(mockService, 'a-different-question').prepareAndSave({ a: 'b' });
		assert.equal(mockService.db.gateway1Info.upsert.mock.callCount(), 0);
		assert.equal(mockService.db.gateway2Info.upsert.mock.callCount(), 0);
		assert.equal(mockService.db.gateway3Info.upsert.mock.callCount(), 0);
		assert.equal(mockService.db.examinationInfo.upsert.mock.callCount(), 0);
	});
	it('updates the completion date of the proceed to examination submission', async () => {
		const mockService = createMockService();
		const answers = { gateway3CompletionDate: mockDate };
		const expectedQuery = {
			where: { gateway3Info: { caseId: 'someCaseId' }, decision: '1' },
			data: { completionDate: mockDate }
		};
		const result = await createController(mockService, timetableGateway3CompletionDateUrl).prepareAndSave(answers);
		assert.deepEqual(mockService.db.gateway3Submission.updateMany.mock.calls[0].arguments.at(0), expectedQuery);
		assert.deepEqual(result, { dataWritten: true, writtenToDB: true });
		assert.equal(mockService.db.gateway3Info.upsert.mock.callCount(), 0);
	});
	it('throws when the case cannot be found for the completion date', async () => {
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => null as any);
		await assert.rejects(
			() =>
				createController(mockService, timetableGateway3CompletionDateUrl).prepareAndSave({
					gateway3CompletionDate: mockDate
				}),
			/Case not found/
		);
		assert.equal(mockService.db.gateway3Submission.updateMany.mock.callCount(), 0);
	});
});
