import { Gateway3SaveController } from './gateway-3-save-controller.ts';
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
		const gateway3Controller = new Gateway3SaveController(mockService as unknown as ManageService, 'caseRef');
		const req = {
			params: {}
		} as Request;
		const answers = {};
		const question = '';
		await assert.rejects(gateway3Controller.prepareAndSave(req, answers, question));
	});
	it('rejects when there are no submissions', async () => {
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => ({
			id: 'someCaseId',
			gateway2Info: {
				workshops: [{}]
			},
			gateway3Info: {
				submissions: [] // Workshops is empty
			}
		}));
		const gateway3Controller = new Gateway3SaveController(mockService as unknown as ManageService, 'caseRef');
		const req = {
			params: {}
		} as Request;
		const answers = {};
		const question = '';
		await assert.rejects(gateway3Controller.prepareAndSave(req, answers, question));
	});
	it('saved for the completion date question', async () => {
		const mockService = createMockService();
		const gateway3Controller = new Gateway3SaveController(mockService as unknown as ManageService, 'caseRef');
		const question = 'gateway-3-completion-date-1';
		const req = {
			params: {
				question: question
			}
		} as Request<any, any, any, any, Record<string, any>>;
		const answers = {
			['completionDate-1']: mockDate
		};
		const expectedQuery = {
			create: {
				caseId: 'someCaseId',
				submissions: {
					createMany: {
						data: [
							{
								completionDate: mockDate,
								decision: undefined
							}
						]
					}
				}
			},
			update: {
				submissions: {
					createMany: {
						data: [
							{
								completionDate: mockDate,
								decision: undefined
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
		await gateway3Controller.prepareAndSave(req, answers, question);
		assert.deepEqual(mockService.db.gateway3Info.upsert.mock.calls[0].arguments.at(0), expectedQuery);
	});
});
