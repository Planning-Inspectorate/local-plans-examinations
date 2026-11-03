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
		const req = {
			params: {}
		} as Request;
		const answers = {};
		const question = '';
		req.params.question = question;
		const gateway3Controller = new Gateway3SaveController(mockService as unknown as ManageService, req, 'caseRef');
		await assert.rejects(gateway3Controller.prepareAndSave(answers));
	});
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
	it('saves the examination website to the Gateway 3 portal field and the examination details', async () => {
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => ({
			id: 'someCaseId',
			examinationInfo: { hearings: [], planPauseHistory: [], status: undefined }
		}));
		const req = {
			params: {
				question: 'examination-website'
			}
		} as Request<any, any, any, any, Record<string, any>>;
		const gateway3Controller = new Gateway3SaveController(mockService as unknown as ManageService, req, 'caseRef');

		await gateway3Controller.prepareAndSave({ examinationWebsite: '  www.example.com/examination  ' });

		assert.deepEqual(mockService.db.gateway3Info.upsert.mock.calls[0].arguments.at(0), {
			where: { caseId: 'someCaseId' },
			update: { examinationWebsiteUrl: 'www.example.com/examination' },
			create: { caseId: 'someCaseId', examinationWebsiteUrl: 'www.example.com/examination' }
		});
		assert.equal(mockService.db.examinationInfo.upsert.mock.callCount(), 1);
		assert.equal(
			mockService.db.examinationInfo.upsert.mock.calls[0].arguments.at(0).update.examinationWebsite,
			'www.example.com/examination'
		);
	});
});

describe('saveGateway3Submissions', () => {
	it('preserves the received date for each submission when saving a decision', async () => {
		const upsert = mock.fn(async (_data: any) => ({}));
		const submissions = [
			{
				id: 'received',
				gateway3InfoId: 'gateway-3',
				decision: '2',
				completionDate: mockDate,
				submittedDate: new Date('2025-12-01T12:00:00.000Z')
			},
			{ id: 'awaiting', gateway3InfoId: 'gateway-3', decision: null, completionDate: null, submittedDate: null }
		];

		await saveGateway3Submissions({ gateway3Info: { upsert } } as never, 'case-id', submissions);

		const data = upsert.mock.calls[0].arguments[0];
		for (const operation of [data.update, data.create]) {
			assert.deepEqual(operation.submissions.createMany.data, [
				{ decision: '2', completionDate: mockDate, submittedDate: submissions[0].submittedDate },
				{ decision: null, completionDate: null, submittedDate: null }
			]);
		}
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
