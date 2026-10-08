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
		const question = '';
		mockService.db.case.findUnique = mock.fn(async () => undefined);
		const req = {
			params: {}
		} as Request;
		req.params.question = question;
		const answers = {};
		const gateway2Controller = new Gateway2SaveController(mockService as unknown as ManageService, req, 'caseRef');
		await assert.rejects(gateway2Controller.prepareAndSave(answers));
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
		const req = {
			params: {}
		} as Request;
		const answers = {};
		const question = '';
		req.params.question = question;
		const gateway2Controller = new Gateway2SaveController(mockService as unknown as ManageService, req, 'caseRef');
		await assert.rejects(gateway2Controller.prepareAndSave(answers));
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
		const req = {
			params: {},
			url: '/check-your-answers'
		} as Request;
		const answers = {};
		const question = 'gateway-2-workshop-date-and-time';
		req.params.question = question;
		const gateway2Controller = new Gateway2SaveController(mockService as unknown as ManageService, req, 'caseRef');
		await assert.rejects(gateway2Controller.prepareAndSave(answers));
	});
	it('can save a non-workshop field with an assessor question to the database', async () => {
		const mockService = createMockService();
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
		req.params.question = question;
		const gateway2Controller = new Gateway2SaveController(mockService as unknown as ManageService, req, 'caseRef');
		await gateway2Controller.prepareAndSave(answers);
		assert.deepEqual(mockService.db.gateway2Info.upsert.mock.calls[0].arguments.at(0), expectedQuery);
	});
	it('can save the workshop field to the session with no existing session data', async () => {
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
		const question = `gateway-2-location-type-${workshopId}`;
		const req = {
			params: {
				question: question
			},
			session: {},
			url: question
		} as Request<any, any, any, any, Record<string, any>>;
		req.params.question = question;
		const answers = {
			[`workshopLocationType-${workshopId}`]: 'a'
		};
		const gateway2Controller = new Gateway2SaveController(mockService as unknown as ManageService, req, 'caseRef');
		await gateway2Controller.prepareAndSave(answers);
		assert.equal(mockService.db.gateway2Info.upsert.mock.calls.length, 0);
		const expectedSession = {
			answers: {
				workshops: [
					{
						id: 'someWorkshop',
						workshopLocationType: 'a'
					}
				]
			}
		};
		assert.deepEqual(req.session, expectedSession);
	});
	it('can save the workshop field to the session with existing session data', async () => {
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
		const question = `gateway-2-location-type-${workshopId}`;
		const req = {
			params: {
				question: question
			},
			session: {
				answers: {
					workshops: [
						{
							workshopDate: '01/01/2026',
							workshopTime: '00:00',
							workshopEndTime: '00:00',
							workshopExpectedDaysKnown: true,
							workshopExpectedDays: 2, // Radio button with nested field
							remoteMeetingLinkKnown: true,
							remoteMeetingLink: 'b',
							workshopLocationKnown: true,
							workshopVenueName: 'c',
							workshopAddressLine: 'd',
							workshopAddressLine2: 'e',
							workshopTownOrCity: 'f',
							workshopPostcode: 'g'
						}
					]
				}
			},
			url: question
		} as unknown as Request<any, any, any, any, Record<string, any>>;
		req.params.question = question;
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
		const gateway2Controller = new Gateway2SaveController(mockService as unknown as ManageService, req, 'caseRef');
		await gateway2Controller.prepareAndSave(answers);
		assert.equal(mockService.db.gateway2Info.upsert.mock.calls.length, 0);
		const expectedSession = {
			answers: {
				workshops: [
					{
						id: 'someWorkshop',
						workshopDate: '01/01/2026',
						workshopTime: '00:00',
						workshopEndTime: '00:00',
						workshopExpectedDaysKnown: true,
						workshopExpectedDays: 2, // Radio button with nested field
						workshopLocationType: 'a',
						remoteMeetingLinkKnown: true,
						remoteMeetingLink: 'b',
						workshopLocationKnown: true,
						workshopVenueName: 'c',
						workshopAddressLine: 'd',
						workshopAddressLine2: 'e',
						workshopTownOrCity: 'f',
						workshopPostcode: 'g'
					}
				]
			}
		};
		assert.deepEqual(req.session, expectedSession);
	});
	it('clears an optional workshop end time when it is removed', async () => {
		const workshopId = 1;
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => ({
			id: 'someCaseId',
			gateway2Info: {
				workshops: [{ id: 'someWorkshop', workshopEndTime: '12:30' }]
			}
		}));
		const question = `gateway-2-workshop-date-and-time-${workshopId}`;
		const req = {
			params: { question },
			session: {
				answers: {
					workshops: [{ id: 'someWorkshop', workshopEndTime: '12:30' }]
				}
			},
			url: question
		} as unknown as Request<any, any, any, any, Record<string, any>>;
		const answers = {
			[`workshopDate-${workshopId}`]: '01/01/2026',
			[`workshopTime-${workshopId}`]: '10:00',
			[`workshopEndTime-${workshopId}`]: undefined
		};

		await new Gateway2SaveController(mockService as unknown as ManageService, req, 'caseRef').prepareAndSave(answers);

		assert.equal(req.session.answers.workshops[0].workshopEndTime, undefined);
	});

	it('removes venue details when a workshop is changed to remote', async () => {
		const workshopId = 1;
		const mockService = createMockService();
		const existingWorkshop = {
			id: 'someWorkshop',
			workshopLocationType: 'in-person',
			workshopLocationKnown: 'yes',
			workshopVenueName: 'Council offices',
			workshopAddressLine: '1 High Street',
			workshopAddressLine2: 'Town Centre',
			workshopTownOrCity: 'Testford',
			workshopPostcode: 'TE1 1ST'
		};
		mockService.db.case.findUnique = mock.fn(async () => ({
			id: 'someCaseId',
			gateway2Info: { workshops: [existingWorkshop] }
		}));
		const question = `gateway-2-location-type-${workshopId}`;
		const req = {
			params: { question },
			session: {},
			url: question
		} as unknown as Request<any, any, any, any, Record<string, any>>;

		await new Gateway2SaveController(mockService as unknown as ManageService, req, 'caseRef').prepareAndSave({
			[`workshopLocationType-${workshopId}`]: 'remote'
		});

		assert.deepEqual(req.session.answers.workshops[0], {
			id: 'someWorkshop',
			workshopLocationType: 'remote'
		});
	});

	it('removes remote meeting details when a workshop is changed to in-person', async () => {
		const workshopId = 1;
		const mockService = createMockService();
		const existingWorkshop = {
			id: 'someWorkshop',
			workshopLocationType: 'remote',
			remoteMeetingLinkKnown: 'yes',
			remoteMeetingLink: 'https://example.com/workshop'
		};
		mockService.db.case.findUnique = mock.fn(async () => ({
			id: 'someCaseId',
			gateway2Info: { workshops: [existingWorkshop] }
		}));
		const question = `gateway-2-location-type-${workshopId}`;
		const req = {
			params: { question },
			session: { answers: { workshops: [existingWorkshop] } },
			url: question
		} as unknown as Request<any, any, any, any, Record<string, any>>;

		await new Gateway2SaveController(mockService as unknown as ManageService, req, 'caseRef').prepareAndSave({
			[`workshopLocationType-${workshopId}`]: 'in-person'
		});

		assert.deepEqual(req.session.answers.workshops[0], {
			id: 'someWorkshop',
			workshopLocationType: 'in-person'
		});
	});

	it('removes conditional answers when they are no longer applicable', async () => {
		const workshopId = 1;
		const mockService = createMockService();
		const existingWorkshop = {
			id: 'someWorkshop',
			workshopExpectedDaysKnown: 'yes',
			workshopExpectedDays: '3',
			remoteMeetingLinkKnown: 'yes',
			remoteMeetingLink: 'https://example.com/workshop'
		};
		mockService.db.case.findUnique = mock.fn(async () => ({
			id: 'someCaseId',
			gateway2Info: { workshops: [existingWorkshop] }
		}));
		const question = `gateway-2-workshop-expected-days-${workshopId}`;
		const req = {
			params: { question },
			session: { answers: { workshops: [existingWorkshop] } },
			url: question
		} as unknown as Request<any, any, any, any, Record<string, any>>;

		await new Gateway2SaveController(mockService as unknown as ManageService, req, 'caseRef').prepareAndSave({
			[`workshopExpectedDaysKnown-${workshopId}`]: 'no',
			[`remoteMeetingLinkKnown-${workshopId}`]: 'no'
		});

		assert.deepEqual(req.session.answers.workshops[0], {
			id: 'someWorkshop',
			workshopExpectedDaysKnown: 'no',
			remoteMeetingLinkKnown: 'no'
		});
	});
	it('can save the workshop field to the database', async () => {
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
		const question = undefined;
		const req = {
			params: {
				question: question
			},
			url: `/check-your-answers-${workshopId}`
		} as Request<any, any, any, any, Record<string, any>>;
		req.params.question = question;
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
		const expectedQuery = {
			create: {
				caseId: 'someCaseId',
				workshops: {
					createMany: {
						data: [
							{
								id: 'someWorkshop',
								createdDate: undefined,
								remoteMeetingLink: 'b',
								remoteMeetingLinkKnown: true,
								workshopAddressLine2: 'e',
								workshopAddressLine: 'd',
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
								id: 'someWorkshop',
								createdDate: undefined,
								remoteMeetingLink: 'b',
								remoteMeetingLinkKnown: true,
								workshopAddressLine2: 'e',
								workshopAddressLine: 'd',
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
		const gateway2Controller = new Gateway2SaveController(mockService as unknown as ManageService, req, 'caseRef');
		await gateway2Controller.prepareAndSave(answers);
		assert.deepEqual(mockService.db.gateway2Info.upsert.mock.calls[0].arguments.at(0), expectedQuery);
	});
	it('Can delete a workshop and save to the database', async () => {
		const mockService = createMockService();
		const workshopA = {
			id: 'someWorkshop-a',
			createdDate: new Date(),
			remoteMeetingLink: 'b',
			remoteMeetingLinkKnown: true,
			workshopAddressLine2: 'e',
			workshopAddressLine: 'd',
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
		};
		const workshopC = {
			id: 'someWorkshop-c',
			createdDate: undefined,
			remoteMeetingLink: 'x',
			remoteMeetingLinkKnown: false,
			workshopAddressLine2: 'y',
			workshopAddressLine: 'z',
			workshopDate: mockDate,
			workshopEndTime: '01:00',
			workshopExpectedDays: 3,
			workshopExpectedDaysKnown: false,
			workshopLocationKnown: false,
			workshopLocationType: 'k',
			workshopPostcode: 'm',
			workshopTime: '00:05',
			workshopTownOrCity: 'n',
			workshopVenueName: 'p'
		};
		mockService.db.case.findUnique = mock.fn(async () => ({
			id: 'someCaseId',
			gateway2Info: {
				workshops: [
					workshopA,
					{
						id: 'someWorkshop-b' // Attempt to delete this workshop
					},
					workshopC
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
		const workshopId = 2;
		const req = {
			params: {},
			url: `/check-your-answers-${workshopId}`
		} as Request<any, any, any, any, Record<string, any>>;
		const gateway2Controller = new Gateway2SaveController(mockService as unknown as ManageService, req, 'caseRef');
		await gateway2Controller.deleteWorkshop(workshopId);
		const modifiedWorkshops = [workshopA, workshopC];
		const expectedQuery = {
			create: {
				caseId: 'someCaseId',
				workshops: {
					createMany: {
						data: modifiedWorkshops
					}
				}
			},
			update: {
				workshops: {
					createMany: {
						data: modifiedWorkshops
					},
					deleteMany: {}
				}
			},
			where: {
				caseId: 'someCaseId'
			}
		};
		assert.deepEqual(mockService.db.gateway2Info.upsert.mock.calls[0].arguments.at(0), expectedQuery);
	});
	it('Rejects when attempting to delete a workshop id greater than the number of workshops', async () => {
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => ({
			id: 'someCaseId',
			gateway2Info: {
				workshops: [
					{
						id: 'someWorkshop-a'
					},
					{
						id: 'someWorkshop-b'
					},
					{
						id: 'someWorkshop-c'
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
		const workshopId = 4;
		const req = {
			params: {},
			url: `/check-your-answers-${workshopId}`
		} as Request<any, any, any, any, Record<string, any>>;
		const gateway2Controller = new Gateway2SaveController(mockService as unknown as ManageService, req, 'caseRef');
		await assert.rejects(gateway2Controller.deleteWorkshop(workshopId));
	});
	it('Rejects when attempting to delete a workshop with id less than 0', async () => {
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => ({
			id: 'someCaseId',
			gateway2Info: {
				workshops: [
					{
						id: 'someWorkshop-a'
					},
					{
						id: 'someWorkshop-b'
					},
					{
						id: 'someWorkshop-c'
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
		const workshopId = -1;
		const req = {
			params: {},
			url: `/check-your-answers-${workshopId}`
		} as Request<any, any, any, any, Record<string, any>>;
		const gateway2Controller = new Gateway2SaveController(mockService as unknown as ManageService, req, 'caseRef');
		await assert.rejects(gateway2Controller.deleteWorkshop(workshopId));
	});
	it('Rejects when attempting to delete the first workshop when there are no workshops', async () => {
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
			}
		}));
		const workshopId = 1;
		const req = {
			params: {},
			url: `/check-your-answers-${workshopId}`
		} as Request<any, any, any, any, Record<string, any>>;
		const gateway2Controller = new Gateway2SaveController(mockService as unknown as ManageService, req, 'caseRef');
		await assert.rejects(gateway2Controller.deleteWorkshop(workshopId));
	});
});
