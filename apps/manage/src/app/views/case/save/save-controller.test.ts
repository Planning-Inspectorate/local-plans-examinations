import { SaveController } from './save-controller.ts';
import type { Request } from 'express';
import { describe, it, beforeEach, afterEach, type Mock, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { SaveInput } from './save-inputs.ts';
import { ODWServiceBusDataSender } from '@pins/local-plans-lib/odw/odw-service-bus.ts';

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

class MockSaveController extends SaveController {
	protected async prepareData(answers: Record<string, any>) {
		return {};
	}
	protected async saveToDatabase(answers: SaveInput, question?: string) {
		return true;
	}
	protected async shouldSaveToSession() {
		return true;
	}
	public async resolveCaseIdProxy() {
		return this.resolveCaseId();
	}
	public async saveToSessionProxy(answers: Record<string, string>) {
		return this.saveToSession(answers);
	}
}

class MockSaveControllerWithDataSavedToTheDatabase extends MockSaveController {
	protected async shouldSaveToSession() {
		return false;
	}
}

class MockSaveControllerWithNoDataSavedToTheDatabase extends MockSaveController {
	protected async saveToDatabase(answers: SaveInput, question?: string) {
		return false;
	}
}

describe('test SaveController', () => {
	let mockSendServiceBusMessage: ReturnType<typeof mock.method<ODWServiceBusDataSender, 'sendUpdateMessage'>>;
	beforeEach(() => {
		mockSendServiceBusMessage = mock.method(ODWServiceBusDataSender.prototype, 'sendUpdateMessage', async () => {});
	});
	afterEach(() => {
		mock.restoreAll();
	});
	it('resolveCaseId rejects when no case can be found', async () => {
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => undefined);
		const req = {
			params: {}
		} as Request;
		const mockSaveController = new MockSaveController(mockService as any, req, 'someRef');
		await assert.rejects(mockSaveController.resolveCaseIdProxy());
	});
	it('can save to a session', async () => {
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => undefined);
		const req = {
			params: {},
			session: {}
		} as Request;
		const answers = {
			someField: 'a',
			anotherField: 'b'
		};
		const mockSaveController = new MockSaveController(mockService as any, req, 'someRef');
		mockSaveController.saveToSessionProxy(answers);
		assert.deepEqual(req.session, { answers: answers });
	});
	it('attempts to send a message to the ODW service bus if data was written to the database', async () => {
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => undefined);
		const req = {
			params: {},
			session: {}
		} as Request;
		const answers = {
			someField: 'a',
			anotherField: 'b'
		};
		const mockSaveController = new MockSaveControllerWithDataSavedToTheDatabase(mockService as any, req, 'someRef');
		await mockSaveController.prepareAndSave(answers);
		assert.deepEqual(mockSendServiceBusMessage.mock.calls.length, 1);
	});
	it('does not attempt to send a message to the ODW service bus if no data was written to the database', async () => {
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => undefined);
		const req = {
			params: {},
			session: {}
		} as Request;
		const answers = {
			someField: 'a',
			anotherField: 'b'
		};
		const mockSaveController = new MockSaveControllerWithNoDataSavedToTheDatabase(mockService as any, req, 'someRef');
		await mockSaveController.prepareAndSave(answers);
		assert.deepEqual(mockSendServiceBusMessage.mock.calls.length, 0);
	});
});
