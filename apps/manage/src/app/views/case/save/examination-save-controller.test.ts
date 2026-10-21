import { ExaminationSaveController } from './examination-save-controller.ts';
import { ManageService } from '#service';
import type { Request } from 'express';
import { describe, it, type Mock, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { ExaminationPause } from '@pins/local-plans-database/src/client/client.ts';

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
	};
};
function createMockService(): MockServiceType {
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
						pauses: [
							{
								createdDate: new Date(2026, 0, 1),
								startDate: new Date(2026, 0, 2),
								endDate: new Date(2026, 0, 5)
							},
							{
								createdDate: new Date(2026, 5, 1),
								startDate: new Date(2026, 5, 2),
								endDate: new Date(2026, 5, 3)
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
	public wrapValidatePauses(pauses: ExaminationPause[]) {
		return this.validatePauses(pauses);
	}
}

describe('test Gateway1SaveController', () => {
	it('can save an examination', async () => {
		const mockService = createMockService();
		const question = 'examining-inspector-1';
		const req = {
			params: {}
		} as Request;
		req.params.question = question;
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
					pauses: undefined
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
					pauses: [
						{
							startTime: new Date(),
							details: 'The first pause'
						},
						{
							startTime: new Date(),
							details: 'The third pause' // Deliberately out of order, should be sorted
						},
						{
							startTime: new Date(),
							details: 'The second pause' // Deliberately out of order, should be sorted
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
					pauses: [
						{
							startTime: new Date(),
							details: 'The first pause'
						},
						{
							startTime: new Date(),
							details: 'The second pause'
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
					pauses: [
						{
							startTime: new Date(),
							details: 'The first pause'
						},
						{
							startTime: new Date(),
							details: 'The second pause'
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
				'startDate-1': new Date(2026, 2, 1),
				'details-1': 'some details'
			};
			const expectedOutput = {
				pauses: [
					{
						createdDate: new Date(2026, 0, 1),
						endDate: new Date(2026, 0, 5),
						startDate: new Date(2026, 2, 1)
					},
					{
						createdDate: new Date(2026, 5, 1),
						startDate: new Date(2026, 5, 2),
						endDate: new Date(2026, 5, 3)
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
				'startDate-1': new Date(2026, 2, 1),
				'details-1': 'some details'
			};
			const expectedOutput = {
				pauses: [
					{
						createdDate: new Date(2026, 0, 1),
						endDate: new Date(2026, 0, 5),
						startDate: new Date(2026, 0, 2),
						details: 'some details'
					},
					{
						createdDate: new Date(2026, 5, 1),
						startDate: new Date(2026, 5, 2),
						endDate: new Date(2026, 5, 3)
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
				'startDate-1': new Date(2026, 2, 1),
				'details-1': 'some details',
				'endDate-1': new Date(2026, 5, 2)
			};
			const expectedOutput = {
				pauses: [
					{
						createdDate: new Date(2026, 0, 1),
						endDate: new Date(2026, 5, 2),
						startDate: new Date(2026, 0, 2)
					},
					{
						createdDate: new Date(2026, 5, 1),
						startDate: new Date(2026, 5, 2),
						endDate: new Date(2026, 5, 3)
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
				'startDate-3': new Date(2026, 2, 1)
			};
			const actualOutput = await examinationController.wrapPrepareData(answers);
			assert.equal(actualOutput.pauses.length, 3);
			const pause = actualOutput.pauses.at(2);
			assert.notEqual(pause, undefined);
			assert.deepEqual((pause as any).startDate, new Date(2026, 2, 1));
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
				'endDate-1': null // Set clear the endDate for the first pause, when there are two pauses already
			};
			// All pauses MUST have an endDate set except for the last pause
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
				pauses: [
					{
						createdDate: new Date(2026, 0, 1),
						endDate: new Date(2026, 5, 2),
						startDate: new Date(2026, 0, 2)
					},
					{
						createdDate: new Date(2026, 5, 1),
						startDate: new Date(2026, 5, 2)
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
				pauses: [
					{
						createdDate: undefined,
						endDate: undefined,
						startDate: undefined
					},
					{
						createdDate: new Date(2026, 5, 1),
						startDate: new Date(2026, 5, 2),
						details: 'old details' // Should not be overwritten
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
				pauses: [
					{
						createdDate: new Date(2026, 0, 1),
						endDate: new Date(2026, 5, 2),
						startDate: new Date(2026, 0, 2),
						details: 'some details'
					},
					{
						createdDate: new Date(2026, 5, 1),
						startDate: new Date(2026, 5, 2)
					}
				]
			};
			const expectedSessionAnswers = {
				pauses: [
					{
						createdDate: new Date(2026, 0, 1),
						endDate: new Date(2026, 5, 2),
						startDate: new Date(2026, 0, 2),
						details: 'some details'
					},
					{
						createdDate: new Date(2026, 5, 1),
						startDate: new Date(2026, 5, 2),
						details: 'old details' // Should not be overwritten
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
		const answers = {
			pauses: [
				{
					createdDate: new Date(2026, 0, 1),
					details: 'new details 1',
					endDate: new Date(2026, 5, 2),
					startDate: new Date(2026, 0, 2)
				},
				{
					createdDate: new Date(2026, 5, 1),
					details: 'new details 2',
					startDate: new Date(2026, 5, 2)
				}
			]
		};
		await examinationController.wrapSaveToDatabase(answers);
		assert.deepEqual(mockService.db.examinationInfo.upsert.mock.calls[0].arguments[0], {
			create: {
				caseId: 'someCaseId',
				pauses: {
					createMany: {
						data: [
							{
								createdDate: new Date(2026, 0, 1),
								details: 'new details 1',
								endDate: new Date(2026, 5, 2),
								startDate: new Date(2026, 0, 2)
							},
							{
								createdDate: new Date(2026, 5, 1),
								details: 'new details 2',
								startDate: new Date(2026, 5, 2),
								endDate: undefined
							}
						]
					}
				}
			},
			update: {
				pauses: {
					createMany: {
						data: [
							{
								createdDate: new Date(2026, 0, 1),
								details: 'new details 1',
								endDate: new Date(2026, 5, 2),
								startDate: new Date(2026, 0, 2)
							},
							{
								createdDate: new Date(2026, 5, 1),
								details: 'new details 2',
								startDate: new Date(2026, 5, 2),
								endDate: undefined
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
			const pauses: ExaminationPause[] = [];
			const validationResult = examinationController.wrapValidatePauses(pauses);
			assert.equal(validationResult, true);
		});
		it('returns true when all pauses have endDate specified', () => {
			const pauses: ExaminationPause[] = [
				{
					createdDate: new Date(2026, 0, 1),
					details: 'new details 1',
					endDate: new Date(2026, 5, 2),
					startDate: new Date(2026, 0, 2),
					examinationInfoId: ''
				},
				{
					createdDate: new Date(2026, 5, 1),
					details: 'new details 2',
					startDate: new Date(2026, 5, 2),
					endDate: new Date(2026, 5, 3),
					examinationInfoId: ''
				}
			];
			const validationResult = examinationController.wrapValidatePauses(pauses);
			assert.equal(validationResult, true);
		});
		it('returns true when all pauses have endDate specified except for the last element', () => {
			const pauses: ExaminationPause[] = [
				{
					createdDate: new Date(2026, 0, 1),
					details: 'new details 1',
					endDate: new Date(2026, 5, 2),
					startDate: new Date(2026, 0, 2),
					examinationInfoId: ''
				},
				{
					createdDate: new Date(2026, 5, 1),
					details: 'new details 2',
					startDate: new Date(2026, 5, 2),
					endDate: null,
					examinationInfoId: ''
				}
			];
			const validationResult = examinationController.wrapValidatePauses(pauses);
			assert.equal(validationResult, true);
		});
		it('returns false when one element in the middle of the pause list has endDate not specified', () => {
			const pauses: ExaminationPause[] = [
				{
					createdDate: new Date(2026, 0, 1),
					details: 'new details 1',
					endDate: null,
					startDate: new Date(2026, 0, 2),
					examinationInfoId: ''
				},
				{
					createdDate: new Date(2026, 5, 1),
					details: 'new details 2',
					startDate: new Date(2026, 5, 2),
					endDate: new Date(2026, 5, 3),
					examinationInfoId: ''
				}
			];
			const validationResult = examinationController.wrapValidatePauses(pauses);
			assert.equal(validationResult, false);
		});
	});
});
