import { Gateway3SaveController, saveGateway3Submissions } from './gateway-3-save-controller.ts';
import { ManageService } from '#service';
import type { Request } from 'express';
import { describe, it, type Mock, mock } from 'node:test';
import assert from 'node:assert/strict';
import { NUM_GW3_SUBMISSIONS_QUESTIONS } from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';

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
		const req = {
			params: {}
		} as Request;
		const answers = {};
		const question = '';
		req.params.question = question;
		const gateway3Controller = new Gateway3SaveController(mockService as unknown as ManageService, req, 'caseRef');
		await assert.rejects(gateway3Controller.prepareAndSave(answers));
	});
	for (const gateway3Info of [null, { submissions: [] }]) {
		it(`does not write a completion date when Gateway 3 info is ${gateway3Info ? 'empty' : 'missing'}`, async () => {
			const mockService = createMockService();
			mockService.db.case.findUnique = mock.fn(async () => ({ id: 'someCaseId', gateway3Info }));
			const req = { params: { question: 'gateway-3-completion-date-1' } } as unknown as Request;
			const controller = new Gateway3SaveController(mockService as unknown as ManageService, req, 'caseRef');

			await controller.prepareAndSave({ 'completionDate-1': mockDate });

			assert.equal(mockService.db.gateway3Info.upsert.mock.callCount(), 0);
		});
	}

	it('saves another Gateway 3 field when there are no submissions', async () => {
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => ({
			id: 'someCaseId',
			gateway3Info: { submissions: [] }
		}));
		const req = { params: { question: 'gateway-3-expected-date' } } as unknown as Request;
		const controller = new Gateway3SaveController(mockService as unknown as ManageService, req, 'caseRef');

		await controller.prepareAndSave({ expectedDate: mockDate });

		assert.deepEqual(mockService.db.gateway3Info.upsert.mock.calls[0].arguments[0], {
			where: { caseId: 'someCaseId' },
			update: { expectedDate: mockDate },
			create: { caseId: 'someCaseId', expectedDate: mockDate }
		});
	});

	for (const submissionNumber of ['0', '2', '-1', '1.5', 'invalid']) {
		it(`rejects invalid submission number ${submissionNumber} without writing`, async () => {
			const mockService = createMockService();
			const req = {
				params: { question: `gateway-3-completion-date-${submissionNumber}` }
			} as unknown as Request;
			const controller = new Gateway3SaveController(mockService as unknown as ManageService, req, 'caseRef');

			await assert.rejects(controller.prepareAndSave({}), /Invalid Gateway 3 submission number/);

			assert.equal(mockService.db.gateway3Info.upsert.mock.callCount(), 0);
		});
	}

	it('saved for the completion date question', async () => {
		const mockService = createMockService();
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
		req.params.question = question;
		const gateway3Controller = new Gateway3SaveController(mockService as unknown as ManageService, req, 'caseRef');
		await gateway3Controller.prepareAndSave(answers);
		assert.deepEqual(mockService.db.gateway3Info.upsert.mock.calls[0].arguments.at(0), expectedQuery);
	});
});

describe('saveGateway3Submissions', () => {
	it('does not write or delete submissions when the array is empty', async () => {
		const upsert = mock.fn(async () => ({}));

		await saveGateway3Submissions({ gateway3Info: { upsert } } as never, 'case-id', []);

		assert.equal(upsert.mock.callCount(), 0);
	});

	it('rejects submissions above the configured maximum without writing to the database', async () => {
		const upsert = mock.fn(async () => ({}));
		const submissions = Array.from({ length: NUM_GW3_SUBMISSIONS_QUESTIONS + 1 }, () => ({
			decision: undefined,
			completionDate: undefined
		}));

		await assert.rejects(
			saveGateway3Submissions({ gateway3Info: { upsert } } as never, 'case-id', submissions as never),
			/Max number of submissions has been exceeded/
		);
		assert.equal(upsert.mock.callCount(), 0);
	});
});
