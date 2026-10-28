import { ExaminationSaveController } from './examination-save-controller.ts';
import type { ManageService } from '#service';
import type { Request } from 'express';
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { PlanPauseHistory } from '@pins/local-plans-database/src/client/client.ts';
import { EXAMINATION_STATUS_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';

function createMockService(examinationStatus?: string) {
	return {
		db: {
			case: {
				findUnique: mock.fn(async () => ({
					id: 'someCaseId',
					gateway2Info: {
						workshops: []
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
					},
					examinationInfo: {
						hearings: [{}],
						status: examinationStatus,
						planPauseHistory: [
							{
								createdAt: new Date(2026, 0, 1),
								planPauseDate: new Date(2026, 0, 2),
								planPauseEndDate: new Date(2026, 0, 5)
							},
							{
								createdAt: new Date(2026, 5, 1),
								planPauseDate: new Date(2026, 5, 2),
								planPauseEndDate: new Date(2026, 5, 3)
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
				findUnique: mock.fn(async (_args: unknown) => ({})),
				upsert: mock.fn(async (_args: unknown) => ({}))
			}
		}
	};
}

const mockDate = new Date('2026-01-01T00:00:00.000Z');
mock.timers.enable({
	apis: ['Date'],
	now: mockDate
});

class ExamSaveControllerWrapper extends ExaminationSaveController {
	public async wrapShouldSaveToSession() {
		return await this.shouldSaveToSession();
	}
	public async wrapPrepareData(answers: Record<string, any>) {
		return await this.prepareData(answers);
	}
	public async wrapSaveToSession(answers: any) {
		return await this.saveToSession(answers);
	}
	public async wrapSaveToDatabase(answers: any) {
		return await this.saveToDatabase(answers);
	}
	public wrapValidatePauses(pauses: PlanPauseHistory[]) {
		return this.validatePauses(pauses);
	}
}

describe('ExaminationSaveController', () => {
	it('can save an examination', async () => {
		const mockService = createMockService();
		const req = { params: { question: 'examining-inspector-1' } } as unknown as Request;
		const answers = {};
		const expectedAnswers = {
			examiningInspectorAppointmentDate: mockDate
		};
		const expectedQuery = {
			where: { caseId: 'someCaseId' },
			update: { ...expectedAnswers },
			create: {
				caseId: 'someCaseId',
				...expectedAnswers
			}
		};
		const examinationController = new ExaminationSaveController(
			mockService as unknown as ManageService,
			req,
			'caseRef'
		);
		await examinationController.prepareAndSave(answers);
		assert.deepEqual(mockService.db.examinationInfo.upsert.mock.calls[0].arguments.at(0), expectedQuery);
	});

	it('moves a submitted examination to In examination when an inspector is assigned', async () => {
		const mockService = createMockService(EXAMINATION_STATUS_ID.SUBMITTED);
		const req = { params: { question: 'examining-inspector-1' } } as unknown as Request;
		const answers = { examiningInspector1: 'inspector-id' };
		const expectedAnswers = {
			...answers,
			examiningInspectorAppointmentDate: mockDate,
			status: EXAMINATION_STATUS_ID.IN_EXAMINATION
		};
		const examinationController = new ExaminationSaveController(
			mockService as unknown as ManageService,
			req,
			'caseRef'
		);

		await examinationController.prepareAndSave(answers);

		assert.deepEqual(mockService.db.examinationInfo.upsert.mock.calls[0].arguments.at(0), {
			where: { caseId: 'someCaseId' },
			update: expectedAnswers,
			create: {
				caseId: 'someCaseId',
				...expectedAnswers
			}
		});
	});

	describe('should save to session', async () => {
		it('rejects when there are no case details', async () => {
			const mockService = createMockService();
			mockService.db.case.findUnique = mock.fn(async () => null);
			const req = {
				params: {}
			} as Request;
			const examinationController = new ExamSaveControllerWrapper(
				mockService as unknown as ManageService,
				req,
				'caseRef'
			);
			await assert.rejects(examinationController.wrapShouldSaveToSession());
		});
		it('returns false when pauses is undefined', async () => {
			const mockService = createMockService();
			mockService.db.case.findUnique = mock.fn(async () => ({
				id: 'someCaseId',
				gateway2Info: {
					workshops: []
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
				},
				examinationInfo: {
					planPauseHistory: undefined
				}
			}));
			const req = {
				params: {}
			} as Request;
			const examinationController = new ExamSaveControllerWrapper(
				mockService as unknown as ManageService,
				req,
				'caseRef'
			);
		});
		it('returns false when attempting to modify the second pause question', async () => {
			const question = 'examination-pause-details-3';
			const mockService = createMockService();
			mockService.db.case.findUnique = mock.fn(async () => ({
				id: 'someCaseId',
				gateway2Info: {
					workshops: []
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
				},
				examinationInfo: {
					planPauseHistory: [
						{
							startTime: new Date(),
							planPauseStartDetails: 'The first pause'
						},
						{
							startTime: new Date(),
							planPauseStartDetails: 'The third pause' // Deliberately out of order, should be sorted
						},
						{
							startTime: new Date(),
							planPauseStartDetails: 'The second pause' // Deliberately out of order, should be sorted
						}
					]
				}
			}));
			const req = {
				params: {}
			} as Request;
			req.params.question = question;
			const examinationController = new ExamSaveControllerWrapper(
				mockService as unknown as ManageService,
				req,
				'caseRef'
			);
			const result = await examinationController.wrapShouldSaveToSession();
			assert.equal(result, false);
		});
		it('returns false when attempting to modify the first pause question with no existing data', async () => {
			const question = 'examination-pause-start-date-3';
			const mockService = createMockService();
			mockService.db.case.findUnique = mock.fn(async () => ({
				id: 'someCaseId',
				gateway2Info: {
					workshops: []
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
				},
				examinationInfo: {
					planPauseHistory: [
						{
							startTime: new Date(),
							planPauseStartDetails: 'The first pause'
						},
						{
							startTime: new Date(),
							planPauseStartDetails: 'The second pause'
						}
					]
				}
			}));
			const req = {
				params: {}
			} as Request;
			req.params.question = question;
			const examinationController = new ExamSaveControllerWrapper(
				mockService as unknown as ManageService,
				req,
				'caseRef'
			);
			const result = await examinationController.wrapShouldSaveToSession();
			assert.equal(result, true);
		});
		it('returns true when attempting to modify the first pause question with existing data', async () => {
			const question = 'examination-pause-start-date-2';
			const mockService = createMockService();
			mockService.db.case.findUnique = mock.fn(async () => ({
				id: 'someCaseId',
				gateway2Info: {
					workshops: []
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
				},
				examinationInfo: {
					planPauseHistory: [
						{
							startTime: new Date(),
							planPauseStartDetails: 'The first pause'
						},
						{
							startTime: new Date(),
							planPauseStartDetails: 'The second pause'
						}
					]
				}
			}));
			const req = {
				params: {}
			} as Request;
			req.params.question = question;
			const examinationController = new ExamSaveControllerWrapper(
				mockService as unknown as ManageService,
				req,
				'caseRef'
			);
			const result = await examinationController.wrapShouldSaveToSession();
			assert.equal(result, false);
		});
	});
	describe('prepareData', async () => {
		it('can prepare pause data for the pause start date question', async () => {
			const question = 'examination-pause-start-date-1';
			const mockService = createMockService();
			const req = {
				params: {},
				url: `some/url/${question}`
			} as Request;
			req.params.question = question;
			const examinationController = new ExamSaveControllerWrapper(
				mockService as unknown as ManageService,
				req,
				'caseRef'
			);
			const answers = {
				'planPauseDate-1': new Date(2026, 2, 1),
				'planPauseStartDetails-1': 'some details'
			};
			const expectedOutput = {
				planPauseHistory: [
					{
						createdAt: new Date(2026, 0, 1),
						planPauseEndDate: new Date(2026, 0, 5),
						planPauseDate: new Date(2026, 2, 1)
					},
					{
						createdAt: new Date(2026, 5, 1),
						planPauseDate: new Date(2026, 5, 2),
						planPauseEndDate: new Date(2026, 5, 3)
					}
				]
			};
			const actualOutput = await examinationController.wrapPrepareData(answers);
			assert.deepEqual(actualOutput, expectedOutput);
		});
		it('can prepare pause data for the pause details question', async () => {
			const question = 'examination-pause-details-1';
			const mockService = createMockService();
			const req = {
				params: {},
				url: `some/url/${question}`
			} as Request;
			req.params.question = question;
			const examinationController = new ExamSaveControllerWrapper(
				mockService as unknown as ManageService,
				req,
				'caseRef'
			);
			const answers = {
				'planPauseDate-1': new Date(2026, 2, 1),
				'planPauseStartDetails-1': 'some details'
			};
			const expectedOutput = {
				planPauseHistory: [
					{
						createdAt: new Date(2026, 0, 1),
						planPauseEndDate: new Date(2026, 0, 5),
						planPauseDate: new Date(2026, 0, 2),
						planPauseStartDetails: 'some details'
					},
					{
						createdAt: new Date(2026, 5, 1),
						planPauseDate: new Date(2026, 5, 2),
						planPauseEndDate: new Date(2026, 5, 3)
					}
				]
			};
			const actualOutput = await examinationController.wrapPrepareData(answers);
			assert.deepEqual(actualOutput, expectedOutput);
		});
		it('can prepare pause data for the pause end date question', async () => {
			const question = 'examination-pause-end-date-1';
			const mockService = createMockService();
			const req = {
				params: {},
				url: `some/url/${question}`
			} as Request;
			req.params.question = question;
			const examinationController = new ExamSaveControllerWrapper(
				mockService as unknown as ManageService,
				req,
				'caseRef'
			);
			const answers = {
				'planPauseDate-1': new Date(2026, 2, 1),
				'planPauseStartDetails-1': 'some details',
				'planPauseEndDate-1': new Date(2026, 5, 2)
			};
			const expectedOutput = {
				planPauseHistory: [
					{
						createdAt: new Date(2026, 0, 1),
						planPauseEndDate: new Date(2026, 5, 2),
						planPauseDate: new Date(2026, 0, 2)
					},
					{
						createdAt: new Date(2026, 5, 1),
						planPauseDate: new Date(2026, 5, 2),
						planPauseEndDate: new Date(2026, 5, 3)
					}
				]
			};
			const actualOutput = await examinationController.wrapPrepareData(answers);
			assert.deepEqual(actualOutput, expectedOutput);
		});
		it('can prepare pause data for the pause start date question when the pause id is greater than the number of pauses', async () => {
			const question = 'examination-pause-start-date-3';
			const mockService = createMockService();
			const req = {
				params: {},
				url: `some/url/${question}`
			} as Request;
			req.params.question = question;
			const examinationController = new ExamSaveControllerWrapper(
				mockService as unknown as ManageService,
				req,
				'caseRef'
			);
			const answers = {
				'planPauseDate-3': new Date(2026, 2, 1)
			};
			const actualOutput = await examinationController.wrapPrepareData(answers);
			assert.equal(actualOutput.planPauseHistory.length, 3);
			const pause = actualOutput.planPauseHistory.at(2);
			assert.notEqual(pause, undefined);
			assert.deepEqual((pause as any).planPauseDate, new Date(2026, 2, 1));
		});
		it('rejects when the pause data is invalid', async () => {
			const question = 'examination-pause-end-date-1';
			const mockService = createMockService();
			const req = {
				params: {},
				url: `some/url/${question}`
			} as Request;
			req.params.question = question;
			const examinationController = new ExamSaveControllerWrapper(
				mockService as unknown as ManageService,
				req,
				'caseRef'
			);
			const answers = {
				'planPauseEndDate-1': null // Set clear the planPauseEndDate for the first pause, when there are two pauses already
			};
			// All pauses MUST have an planPauseEndDate set except for the last pause
			await assert.rejects(examinationController.wrapPrepareData(answers));
		});
	});
	describe('saveToSession', async () => {
		it('rejects when there is no pause id in the question', async () => {
			const question = 'examination-pause-end-date';
			const mockService = createMockService();
			const req = {
				params: {},
				url: `some/url/${question}`,
				session: {}
			} as Request;
			req.params.question = question;
			const examinationController = new ExamSaveControllerWrapper(
				mockService as unknown as ManageService,
				req,
				'caseRef'
			);
			await assert.rejects(examinationController.wrapSaveToSession({}));
		});
		it('rejects when there is no session data', async () => {
			const question = 'examination-pause-end-date-1';
			const mockService = createMockService();
			const req = {
				params: {},
				url: `some/url/${question}`
			} as Request;
			req.params.question = question;
			const examinationController = new ExamSaveControllerWrapper(
				mockService as unknown as ManageService,
				req,
				'caseRef'
			);
			await assert.rejects(examinationController.wrapSaveToSession({}));
		});
		it('can add new answers to the session when there are no existing answers', async () => {
			const question = 'examination-pause-end-date-1';
			const mockService = createMockService();
			const req = {
				params: {},
				url: `some/url/${question}`,
				session: {}
			} as Request;
			req.params.question = question;
			const examinationController = new ExamSaveControllerWrapper(
				mockService as unknown as ManageService,
				req,
				'caseRef'
			);
			const answers = {
				planPauseHistory: [
					{
						createdAt: new Date(2026, 0, 1),
						planPauseEndDate: new Date(2026, 5, 2),
						planPauseDate: new Date(2026, 0, 2)
					},
					{
						createdAt: new Date(2026, 5, 1),
						planPauseDate: new Date(2026, 5, 2)
					}
				]
			};
			await examinationController.wrapSaveToSession(answers);
			assert.deepEqual(req.session.answers, answers);
		});
		it('can add new answers to the session when there are existing answers', async () => {
			const question = 'examination-pause-end-date-1';
			const mockService = createMockService();
			const req = {
				params: {},
				url: `some/url/${question}`,
				session: {}
			} as Request;
			req.session.answers = {
				planPauseHistory: [
					{
						createdAt: undefined,
						planPauseEndDate: undefined,
						planPauseDate: undefined
					},
					{
						createdAt: new Date(2026, 5, 1),
						planPauseDate: new Date(2026, 5, 2),
						planPauseStartDetails: 'old details' // Should not be overwritten
					}
				]
			};
			req.params.question = question;
			const examinationController = new ExamSaveControllerWrapper(
				mockService as unknown as ManageService,
				req,
				'caseRef'
			);
			const answers = {
				planPauseHistory: [
					{
						createdAt: new Date(2026, 0, 1),
						planPauseEndDate: new Date(2026, 5, 2),
						planPauseDate: new Date(2026, 0, 2),
						planPauseStartDetails: 'some details'
					},
					{
						createdAt: new Date(2026, 5, 1),
						planPauseDate: new Date(2026, 5, 2)
					}
				]
			};
			const expectedSessionAnswers = {
				planPauseHistory: [
					{
						createdAt: new Date(2026, 0, 1),
						planPauseEndDate: new Date(2026, 5, 2),
						planPauseDate: new Date(2026, 0, 2),
						planPauseStartDetails: 'some details'
					},
					{
						createdAt: new Date(2026, 5, 1),
						planPauseDate: new Date(2026, 5, 2),
						planPauseStartDetails: 'old details' // Should not be overwritten
					}
				]
			};
			await examinationController.wrapSaveToSession(answers);
			assert.deepEqual(req.session.answers, expectedSessionAnswers);
		});
	});
	describe('saveToDatabase', async () => {
		const question = 'examination-pause-end-date-1';
		const mockService = createMockService();
		const req = {
			params: {},
			url: `some/url/${question}`
		} as Request;
		req.params.question = question;
		const examinationController = new ExamSaveControllerWrapper(
			mockService as unknown as ManageService,
			req,
			'caseRef'
		);
		(examinationController as any).caseId = 'someCaseId';
		const answers = {
			planPauseHistory: [
				{
					createdAt: new Date(2026, 0, 1),
					planPauseStartDetails: 'new details 1',
					planPauseEndDate: new Date(2026, 5, 2),
					planPauseDate: new Date(2026, 0, 2)
				},
				{
					createdAt: new Date(2026, 5, 1),
					planPauseStartDetails: 'new details 2',
					planPauseDate: new Date(2026, 5, 2)
				}
			]
		};
		await examinationController.wrapSaveToDatabase(answers);
		assert.deepEqual(mockService.db.examinationInfo.upsert.mock.calls[0].arguments[0], {
			create: {
				caseId: 'someCaseId',
				planPauseHistory: {
					createMany: {
						data: [
							{
								createdAt: new Date(2026, 0, 1),
								planPauseStartDetails: 'new details 1',
								planPauseEndDate: new Date(2026, 5, 2),
								planPauseDate: new Date(2026, 0, 2),
								planPauseEndDetails: undefined
							},
							{
								createdAt: new Date(2026, 5, 1),
								planPauseStartDetails: 'new details 2',
								planPauseDate: new Date(2026, 5, 2),
								planPauseEndDate: undefined,
								planPauseEndDetails: undefined
							}
						]
					}
				}
			},
			update: {
				planPauseHistory: {
					createMany: {
						data: [
							{
								createdAt: new Date(2026, 0, 1),
								planPauseStartDetails: 'new details 1',
								planPauseEndDate: new Date(2026, 5, 2),
								planPauseDate: new Date(2026, 0, 2),
								planPauseEndDetails: undefined
							},
							{
								createdAt: new Date(2026, 5, 1),
								planPauseStartDetails: 'new details 2',
								planPauseDate: new Date(2026, 5, 2),
								planPauseEndDate: undefined,
								planPauseEndDetails: undefined
							}
						]
					},
					deleteMany: {}
				}
			},
			where: {
				caseId: 'someCaseId'
			}
		});
	});
	describe('validatePauses', async () => {
		const question = 'examination-pause-end-date-1';
		const mockService = createMockService();
		const req = {
			params: {},
			url: `some/url/${question}`
		} as Request;
		req.params.question = question;
		const examinationController = new ExamSaveControllerWrapper(
			mockService as unknown as ManageService,
			req,
			'caseRef'
		);
		it('returns true for an empty pause list', () => {
			const pauses: PlanPauseHistory[] = [];
			const validationResult = examinationController.wrapValidatePauses(pauses);
			assert.equal(validationResult, true);
		});
		it('returns true when all pauses have planPauseEndDate specified', () => {
			const pauses: PlanPauseHistory[] = [
				{
					id: '1',
					createdAt: new Date(2026, 0, 1),
					planPauseStartDetails: 'new details 1',
					planPauseEndDate: new Date(2026, 5, 2),
					planPauseEndDetails: null,
					planPauseDate: new Date(2026, 0, 2),
					examinationInfoId: ''
				},
				{
					id: '2',
					createdAt: new Date(2026, 5, 1),
					planPauseStartDetails: 'new details 2',
					planPauseDate: new Date(2026, 5, 2),
					planPauseEndDate: new Date(2026, 5, 3),
					planPauseEndDetails: null,
					examinationInfoId: ''
				}
			];
			const validationResult = examinationController.wrapValidatePauses(pauses);
			assert.equal(validationResult, true);
		});
		it('returns true when all pauses have planPauseEndDate specified except for the last element', () => {
			const pauses: PlanPauseHistory[] = [
				{
					id: '1',
					createdAt: new Date(2026, 0, 1),
					planPauseStartDetails: 'new details 1',
					planPauseEndDate: new Date(2026, 5, 2),
					planPauseDate: new Date(2026, 0, 2),
					planPauseEndDetails: null,
					examinationInfoId: ''
				},
				{
					id: '2',
					createdAt: new Date(2026, 5, 1),
					planPauseStartDetails: 'new details 2',
					planPauseDate: new Date(2026, 5, 2),
					planPauseEndDate: null,
					planPauseEndDetails: null,
					examinationInfoId: ''
				}
			];
			const validationResult = examinationController.wrapValidatePauses(pauses);
			assert.equal(validationResult, true);
		});
		it('returns false when one element in the middle of the pause list has planPauseEndDate not specified', () => {
			const pauses: PlanPauseHistory[] = [
				{
					id: '1',
					createdAt: new Date(2026, 0, 1),
					planPauseStartDetails: 'new details 1',
					planPauseEndDate: null,
					planPauseEndDetails: null,
					planPauseDate: new Date(2026, 0, 2),
					examinationInfoId: ''
				},
				{
					id: '2',
					createdAt: new Date(2026, 5, 1),
					planPauseStartDetails: 'new details 2',
					planPauseDate: new Date(2026, 5, 2),
					planPauseEndDate: new Date(2026, 5, 3),
					planPauseEndDetails: null,
					examinationInfoId: ''
				}
			];
			const validationResult = examinationController.wrapValidatePauses(pauses);
			assert.equal(validationResult, false);
		});
	});
	it('rejects when a case could not be found', async () => {
		const mockService = createMockService();
		const question = '';
		mockService.db.case.findUnique = mock.fn(async () => undefined);
		const req = {
			params: {}
		} as Request;
		req.params.question = question;
		const answers = {};
		const examinationController = new ExaminationSaveController(
			mockService as unknown as ManageService,
			req,
			'caseRef'
		);
		await assert.rejects(examinationController.prepareAndSave(answers));
	});
	it('rejects when there are no hearings', async () => {
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => ({
			id: 'someCaseId',
			gateway2Info: {
				workshops: [{}]
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
			},
			examinationInfo: {} // Hearings is missing
		}));
		const req = {
			params: {}
		} as Request;
		const answers = {};
		const question = '';
		req.params.question = question;
		const examinationController = new ExaminationSaveController(
			mockService as unknown as ManageService,
			req,
			'caseRef'
		);
		await assert.rejects(examinationController.prepareAndSave(answers));
	});
	it('rejects when the current hearing id could not be found', async () => {
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => ({
			id: 'someCaseId',
			gateway2Info: {
				workshops: [{}]
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
			},
			examinationInfo: {
				hearings: [
					{
						id: 'someHearing'
					}
				]
			}
		}));
		const req = {
			params: {},
			url: '/check-your-answers'
		} as Request;
		const answers = {};
		const question = 'examination-hearing-date-and-time';
		req.params.question = question;
		const examinationController = new ExaminationSaveController(
			mockService as unknown as ManageService,
			req,
			'caseRef'
		);
		await assert.rejects(examinationController.prepareAndSave(answers));
	});
	it('can save the hearing field to the session with no existing session data', async () => {
		const hearingId = 1;
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => ({
			id: 'someCaseId',
			gateway2Info: {
				workshops: [{}]
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
			},
			examinationInfo: {
				hearings: [
					{
						id: 'someHearing'
					}
				]
			}
		}));
		const question = `examination-hearing-location-type-${hearingId}`;
		const req = {
			params: {
				question: question
			},
			session: {},
			url: question
		} as Request<any, any, any, any, Record<string, any>>;
		req.params.question = question;
		const answers = {
			[`hearingLocationType-${hearingId}`]: 'a'
		};
		const examinationController = new ExaminationSaveController(
			mockService as unknown as ManageService,
			req,
			'caseRef'
		);
		await examinationController.prepareAndSave(answers);
		assert.equal(mockService.db.examinationInfo.upsert.mock.calls.length, 0);
		const expectedSession = {
			answers: {
				hearings: [
					{
						id: 'someHearing',
						hearingLocationType: 'a'
					}
				]
			}
		};
		assert.deepEqual(req.session, expectedSession);
	});
	it('can save the hearing field to the session with existing session data', async () => {
		const hearingId = 1;
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => ({
			id: 'someCaseId',
			gateway2Info: {
				workshops: [{}]
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
			},
			examinationInfo: {
				hearings: [
					{
						id: 'someHearing'
					}
				]
			}
		}));
		const question = `examination-hearing-location-type-${hearingId}`;
		const req = {
			params: {
				question: question
			},
			session: {
				answers: {
					hearings: [
						{
							hearingDate: '01/01/2026',
							hearingTime: '00:00',
							hearingExpectedDaysKnown: true,
							hearingExpectedDays: 2, // Radio button with nested field
							hearingRemoteMeetingLinkKnown: true,
							hearingRemoteMeetingLink: 'b',
							hearingLocationKnown: true,
							hearingVenueName: 'c',
							hearingAddressLine: 'd',
							hearingAddressLine2: 'e',
							hearingTownOrCity: 'f',
							hearingPostcode: 'g'
						}
					]
				}
			},
			url: question
		} as unknown as Request<any, any, any, any, Record<string, any>>;
		req.params.question = question;
		const answers = {
			[`hearingDate-${hearingId}`]: '01/01/2026',
			[`hearingTime-${hearingId}`]: '00:00',
			[`hearingExpectedDaysKnown-${hearingId}`]: true,
			[`hearingExpectedDaysKnown-${hearingId}_hearingExpectedDays`]: 2, // Radio button with nested field
			[`hearingLocationType-${hearingId}`]: 'a',
			[`hearingRemoteMeetingLinkKnown-${hearingId}`]: true,
			[`hearingRemoteMeetingLink-${hearingId}`]: 'b',
			[`hearingLocationKnown-${hearingId}`]: true,
			[`hearingVenueName-${hearingId}`]: 'c',
			[`hearingAddressLine-${hearingId}`]: 'd',
			[`hearingAddressLine2-${hearingId}`]: 'e',
			[`hearingTownOrCity-${hearingId}`]: 'f',
			[`hearingPostcode-${hearingId}`]: 'g'
		};
		const examinationController = new ExaminationSaveController(
			mockService as unknown as ManageService,
			req,
			'caseRef'
		);
		await examinationController.prepareAndSave(answers);
		assert.equal(mockService.db.examinationInfo.upsert.mock.calls.length, 0);
		const expectedSession = {
			answers: {
				hearings: [
					{
						id: 'someHearing',
						hearingDate: '01/01/2026',
						hearingTime: '00:00',
						hearingExpectedDaysKnown: true,
						hearingExpectedDays: 2, // Radio button with nested field
						hearingLocationType: 'a',
						hearingRemoteMeetingLinkKnown: true,
						hearingRemoteMeetingLink: 'b',
						hearingLocationKnown: true,
						hearingVenueName: 'c',
						hearingAddressLine: 'd',
						hearingAddressLine2: 'e',
						hearingTownOrCity: 'f',
						hearingPostcode: 'g'
					}
				]
			}
		};
		assert.deepEqual(req.session, expectedSession);
	});
	it('can save the hearing field to the database', async () => {
		const hearingId = 1;
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => ({
			id: 'someCaseId',
			gateway2Info: {
				workshops: [{}]
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
			},
			examinationInfo: {
				hearings: [
					{
						id: 'someHearing'
					}
				]
			}
		}));
		const question = undefined;
		const req = {
			params: {
				question: question
			},
			url: `/check-your-answers-${hearingId}`
		} as Request<any, any, any, any, Record<string, any>>;
		req.params.question = question;
		const answers = {
			[`hearingDate-${hearingId}`]: '01/01/2026',
			[`hearingTime-${hearingId}`]: '00:00',
			[`hearingExpectedDaysKnown-${hearingId}`]: true,
			[`hearingExpectedDaysKnown-${hearingId}_hearingExpectedDays`]: 2, // Radio button with nested field
			[`hearingLocationType-${hearingId}`]: 'a',
			[`hearingRemoteMeetingLinkKnown-${hearingId}`]: true,
			[`hearingRemoteMeetingLink-${hearingId}`]: 'b',
			[`hearingLocationKnown-${hearingId}`]: true,
			[`hearingVenueName-${hearingId}`]: 'c',
			[`hearingAddressLine-${hearingId}`]: 'd',
			[`hearingAddressLine2-${hearingId}`]: 'e',
			[`hearingTownOrCity-${hearingId}`]: 'f',
			[`hearingPostcode-${hearingId}`]: 'g'
		};
		const expectedQuery = {
			create: {
				caseId: 'someCaseId',
				hearings: {
					createMany: {
						data: [
							{
								id: 'someHearing',
								createdDate: undefined,
								hearingRemoteMeetingLink: 'b',
								hearingRemoteMeetingLinkKnown: true,
								hearingAddressLine2: 'e',
								hearingAddressLine: 'd',
								hearingDate: mockDate,
								hearingExpectedDays: 2,
								hearingExpectedDaysKnown: true,
								hearingLocationKnown: true,
								hearingLocationType: 'a',
								hearingPostcode: 'g',
								hearingTime: '00:00',
								hearingTownOrCity: 'f',
								hearingVenueName: 'c'
							}
						]
					}
				}
			},
			update: {
				hearings: {
					createMany: {
						data: [
							{
								id: 'someHearing',
								createdDate: undefined,
								hearingRemoteMeetingLink: 'b',
								hearingRemoteMeetingLinkKnown: true,
								hearingAddressLine2: 'e',
								hearingAddressLine: 'd',
								hearingDate: mockDate,
								hearingExpectedDays: 2,
								hearingExpectedDaysKnown: true,
								hearingLocationKnown: true,
								hearingLocationType: 'a',
								hearingPostcode: 'g',
								hearingTime: '00:00',
								hearingTownOrCity: 'f',
								hearingVenueName: 'c'
							}
						]
					},
					deleteMany: {}
				}
			},
			where: {
				caseId: 'someCaseId'
			}
		};
		const examinationController = new ExaminationSaveController(
			mockService as unknown as ManageService,
			req,
			'caseRef'
		);
		await examinationController.prepareAndSave(answers);
		assert.deepEqual(mockService.db.examinationInfo.upsert.mock.calls[0].arguments.at(0), expectedQuery);
	});
});
