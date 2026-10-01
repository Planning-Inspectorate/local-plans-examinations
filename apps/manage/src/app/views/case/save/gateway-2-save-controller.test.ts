import { Gateway2SaveController } from './gateway-2-save-controller.ts';
import { ManageService } from '#service';
import type { Request } from 'express';
import { describe, it, type Mock, mock } from 'node:test';
import assert from 'node:assert/strict';

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

describe('test Gateway2SaveController', () => {
	it('rejects when a case could not be found', async () => {
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => undefined);
		const gateway2Controller = new Gateway2SaveController(mockService as unknown as ManageService, 'caseRef');
		const req = {
			params: {}
		} as Request;
		const answers = {};
		const question = '';
		await assert.rejects(gateway2Controller.prepareAndSave(req, answers, question));
	});
	it('rejects when there are no workshops', async () => {
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => ({
			id: 'someCaseId',
			gateway2Info: {}, // Workshops is missing
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
		}));
		const gateway2Controller = new Gateway2SaveController(mockService as unknown as ManageService, 'caseRef');
		const req = {
			params: {}
		} as Request;
		const answers = {};
		const question = '';
		await assert.rejects(gateway2Controller.prepareAndSave(req, answers, question));
	});
	it('rejects when the current workshop id could not be found', async () => {
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => ({
			id: 'someCaseId',
			gateway2Info: {
				workshops: [
					{
						id: 'someWorkshop'
					}
				]
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
		}));
		const gateway2Controller = new Gateway2SaveController(mockService as unknown as ManageService, 'caseRef');
		const req = {
			params: {},
			url: '/check-your-answers'
		} as Request;
		const answers = {};
		const question = 'gateway-2-workshop-date-and-time';
		await assert.rejects(gateway2Controller.prepareAndSave(req, answers, question));
	});
	it('can save a non-workshop field with an assessor question', async () => {
		const mockService = createMockService();
		const gateway2Controller = new Gateway2SaveController(mockService as unknown as ManageService, 'caseRef');
		const question = 'gateway-2-assessor';
		const req = {
			params: {
				question: question
			}
		} as Request<any, any, any, any, Record<string, any>>;
		const answers = {};
		const expectedAnswers = { assessorAppointmentDate: mockDate };
		const expectedQuery = {
			where: { caseId: 'someCaseId' },
			update: { ...expectedAnswers },
			create: { caseId: 'someCaseId', ...expectedAnswers }
		};
		await gateway2Controller.prepareAndSave(req, answers, question);
		assert.deepEqual(mockService.db.gateway2Info.upsert.mock.calls[0].arguments.at(0), expectedQuery);
	});
	it('can save the workshop field', async () => {
		const workshopId = 1;
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => ({
			id: 'someCaseId',
			gateway2Info: {
				workshops: [
					{
						id: 'someWorkshop'
					}
				]
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
		}));
		const gateway2Controller = new Gateway2SaveController(mockService as unknown as ManageService, 'caseRef');
		const question = undefined;
		const req = {
			params: {
				question: question
			},
			url: `/check-your-answers-${workshopId}`
		} as Request<any, any, any, any, Record<string, any>>;
		const answers = {
			[`workshopDate-${workshopId}`]: '01/01/2026',
			[`workshopTime-${workshopId}`]: '00:00',
			[`workshopEndTime-${workshopId}`]: '00:00',
			[`workshopExpectedDaysKnown-${workshopId}`]: true,
			[`workshopExpectedDaysKnown-${workshopId}_workshopExpectedDays`]: 2, // Radio button with nested field
			[`workshopLocationType-${workshopId}`]: 'a',
			[`remoteMeetingLinkKnown-${workshopId}`]: true,
			[`remoteMeetingLink-${workshopId}`]: 'b',
			[`workshopLocationKnown-${workshopId}`]: true,
			[`workshopVenueName-${workshopId}`]: 'c',
			[`workshopAddressLine-${workshopId}`]: 'd',
			[`workshopAddressLine2-${workshopId}`]: 'e',
			[`workshopTownOrCity-${workshopId}`]: 'f',
			[`workshopPostcode-${workshopId}`]: 'g'
		};
		const expectedAnswers = {};
		const expectedQuery = {
			create: {
				caseId: 'someCaseId',
				workshops: {
					createMany: {
						data: [
							{
								createdDate: undefined,
								remoteMeetingLink: 'b',
								remoteMeetingLinkKnown: true,
								workshopAddressLine2: 'e',
								workshopAddressLine: 'd',
								workshopComplete: true,
								workshopDate: mockDate,
								workshopEndTime: '00:00',
								workshopExpectedDays: 2,
								workshopExpectedDaysKnown: true,
								workshopLocationKnown: true,
								workshopLocationType: 'a',
								workshopPostcode: 'g',
								workshopTime: '00:00',
								workshopTownOrCity: 'f',
								workshopVenueName: 'c'
							}
						]
					}
				}
			},
			update: {
				workshops: {
					createMany: {
						data: [
							{
								createdDate: undefined,
								remoteMeetingLink: 'b',
								remoteMeetingLinkKnown: true,
								workshopAddressLine2: 'e',
								workshopAddressLine: 'd',
								workshopComplete: true,
								workshopDate: mockDate,
								workshopEndTime: '00:00',
								workshopExpectedDays: 2,
								workshopExpectedDaysKnown: true,
								workshopLocationKnown: true,
								workshopLocationType: 'a',
								workshopPostcode: 'g',
								workshopTime: '00:00',
								workshopTownOrCity: 'f',
								workshopVenueName: 'c'
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
		await gateway2Controller.prepareAndSave(req, answers, question);
		assert.deepEqual(mockService.db.gateway2Info.upsert.mock.calls[0].arguments.at(0), expectedQuery);
	});
});
