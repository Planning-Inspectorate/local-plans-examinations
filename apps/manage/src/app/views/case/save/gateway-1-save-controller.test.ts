import { Gateway1SaveController } from './gateway-1-save-controller.ts';
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

describe('test Gateway1SaveController', () => {
	it('can save when the question is signed-sla', async () => {
		const mockService = createMockService();
		const req = {
			params: {}
		} as Request;
		const answers = {};
		const expectedQuery = {
			where: { caseId: 'someCaseId' },
			update: {
				...{
					slaReceivedDate: mockDate
				}
			},
			create: {
				caseId: 'someCaseId',
				...{
					slaReceivedDate: mockDate
				}
			}
		};
		const question = 'signed-sla';
		const gateway1Controller = new Gateway1SaveController(mockService as unknown as ManageService, 'caseRef');
		await gateway1Controller.prepareAndSave(req, answers, question);
		assert.deepEqual(mockService.db.gateway1Info.upsert.mock.calls[0].arguments.at(0), expectedQuery);
	});
	it('can save when Gateway1Info', async () => {
		const mockService = createMockService();
		const req = {
			params: {}
		} as Request;
		const answers = {};
		const expectedQuery = {
			where: { caseId: 'someCaseId' },
			update: { ...answers },
			create: {
				caseId: 'someCaseId',
				...answers
			}
		};
		const question = 'a-different-question';
		const gateway1Controller = new Gateway1SaveController(mockService as unknown as ManageService, 'caseRef');
		await gateway1Controller.prepareAndSave(req, answers, question);
		assert.deepEqual(mockService.db.gateway1Info.upsert.mock.calls[0].arguments.at(0), expectedQuery);
	});
});
