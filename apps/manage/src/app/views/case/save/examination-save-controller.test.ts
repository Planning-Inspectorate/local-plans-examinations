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
						hearings: [{}]
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

describe('test ExaminationSaveController', () => {
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
						hearingDate: mockDate,
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
	it('can save a non-hearing field with an assessor question to the database', async () => {
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
});
