import { SaveController } from './save-controller.ts';
import { OverviewSaveController } from './overview-save-controller.ts';
import { Gateway2SaveController } from './gateway-2-save-controller.ts';
import { Gateway3SaveController } from './gateway-3-save-controller.ts';
import { ExaminationSaveController } from './examination-save-controller.ts';
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

function createMockSaveController(controllerClass: typeof SaveController) {
	return mock.method(
		controllerClass.prototype,
		'prepareAndSave',
		async (req: Request, answers: Record<string, any>, question?: string) => {
			return true;
		}
	);
}

async function checkForSaveDelegation(
	saveController: SaveController,
	mockDelegateSaveController: Mock<
		| ((req: Request, answers: Record<string, any>, question?: string) => Promise<boolean>)
		| ((req: Request, answers: Record<string, any>, question?: string) => Promise<boolean>)
	>,
	question: string
) {
	const req = {
		params: {}
	} as Request;
	const answers = {};
	await saveController.prepareAndSave(req, answers, question);
	assert.equal(mockDelegateSaveController.mock.callCount(), 1);
}

const mockDate = new Date('2026-01-01T00:00:00.000Z');
mock.timers.enable({
	apis: ['Date'],
	now: mockDate
});
/*
describe('test OverviewSaveController', () => {
	it('can delegate when saving assessor gateway 2 question', async () => {
		const mockGatway2Controller = createMockSaveController(Gateway2SaveController);
		const overviewController = new OverviewSaveController(createMockService() as unknown as ManageService, 'caseRef');
		await checkForSaveDelegation(overviewController, mockGatway2Controller, 'assessor-gateway-2');
	});
	it('can delegate when saving assessor gateway 3 question', async () => {
		const mockGatway3Controller = createMockSaveController(Gateway3SaveController);
		const overviewController = new OverviewSaveController(createMockService() as unknown as ManageService, 'caseRef');
		await checkForSaveDelegation(overviewController, mockGatway3Controller, 'assessor-gateway-3');
	});
	it('can delegate when saving programme officer question', async () => {
		const mockGatway3Controller = createMockSaveController(Gateway3SaveController);
		const overviewController = new OverviewSaveController(createMockService() as unknown as ManageService, 'caseRef');
		await checkForSaveDelegation(overviewController, mockGatway3Controller, 'programme-officer');
	});
	it('can delegate when saving examining inspector 1 question', async () => {
		const mockExaminationController = createMockSaveController(ExaminationSaveController);
		const overviewController = new OverviewSaveController(createMockService() as unknown as ManageService, 'caseRef');
		await checkForSaveDelegation(overviewController, mockExaminationController, 'examining-inspector-1');
	});
	it('can delegate when saving examining inspector 2 question', async () => {
		const mockExaminationController = createMockSaveController(ExaminationSaveController);
		const overviewController = new OverviewSaveController(createMockService() as unknown as ManageService, 'caseRef');
		await checkForSaveDelegation(overviewController, mockExaminationController, 'examining-inspector-2');
	});
	it('can delegate when saving examining inspector 3 question', async () => {
		const mockExaminationController = createMockSaveController(ExaminationSaveController);
		const overviewController = new OverviewSaveController(createMockService() as unknown as ManageService, 'caseRef');
		await checkForSaveDelegation(overviewController, mockExaminationController, 'examining-inspector-3');
	});
	it('can delegate when saving examination website question', async () => {
		const mockExaminationController = createMockSaveController(ExaminationSaveController);
		const overviewController = new OverviewSaveController(createMockService() as unknown as ManageService, 'caseRef');
		await checkForSaveDelegation(overviewController, mockExaminationController, 'examination-website');
	});
	it('can delegate when saving examining inspector 1 question', async () => {
		const mockExaminationController = createMockSaveController(ExaminationSaveController);
		const overviewController = new OverviewSaveController(createMockService() as unknown as ManageService, 'caseRef');
		await checkForSaveDelegation(overviewController, mockExaminationController, 'examining-inspector-1');
	});
	it('can delegate when saving examining inspector 2 question', async () => {
		const mockExaminationController = createMockSaveController(ExaminationSaveController);
		const overviewController = new OverviewSaveController(createMockService() as unknown as ManageService, 'caseRef');
		await checkForSaveDelegation(overviewController, mockExaminationController, 'examining-inspector-2');
	});
	it('can delegate when saving examining inspector 3 question', async () => {
		const mockExaminationController = createMockSaveController(ExaminationSaveController);
		const overviewController = new OverviewSaveController(createMockService() as unknown as ManageService, 'caseRef');
		await checkForSaveDelegation(overviewController, mockExaminationController, 'examining-inspector-3');
	});
	it('can delegate when saving qa inspector 1 question', async () => {
		const mockExaminationController = createMockSaveController(ExaminationSaveController);
		const overviewController = new OverviewSaveController(createMockService() as unknown as ManageService, 'caseRef');
		await checkForSaveDelegation(overviewController, mockExaminationController, 'qa-inspector-1');
	});
	it('can delegate when saving qa inspector 2 question', async () => {
		const mockExaminationController = createMockSaveController(ExaminationSaveController);
		const overviewController = new OverviewSaveController(createMockService() as unknown as ManageService, 'caseRef');
		await checkForSaveDelegation(overviewController, mockExaminationController, 'qa-inspector-2');
	});
	it('can delegate when saving qa inspector 3 question', async () => {
		const mockExaminationController = createMockSaveController(ExaminationSaveController);
		const overviewController = new OverviewSaveController(createMockService() as unknown as ManageService, 'caseRef');
		await checkForSaveDelegation(overviewController, mockExaminationController, 'qa-inspector-3');
	});
	it('can save contacts', async () => {});
	it('can save LPAs', async () => {});
	it('can save contact details', async () => {});
	it('can save a case', async () => {});
});
*/
