import { buildSaveController } from './save.ts';
import assert from 'node:assert';
import { describe, it, mock, before } from 'node:test';

describe('buildSaveController', () => {
	let mockService: any;
	let mockRequest: any;
	let mockResponse: any;

	before(() => {
		mockService = {
			db: {
				case: {
					create: mock.fn(async () => ({ id: '123' }))
				}
			},
			notifyClient: {
				sendEmail: mock.fn(async () => ({}))
			},
			logger: {
				info: mock.fn(),
				warn: mock.fn(),
				error: mock.fn()
			}
		};

		mockRequest = {
			session: {},
			baseUrl: '/create-case'
		};

		mockResponse = {
			locals: {
				journeyResponse: {
					answers: {
						caseOfficer: 'John Doe',
						planTitle: 'Development Plan 2024',
						planType: 'Local Plan',
						email: 'contact@lpa.gov.uk',
						reference: '',
						checkLpas: [{ lpa: 'lpa-1' }, { lpa: 'lpa-2' }],
						contactDetails: [
							{
								firstName: 'Jane',
								lastName: 'Smith',
								email: 'jane@lpa.gov.uk',
								phone: '01234567890',
								lpaContact: 'lpa-1'
							},
							{
								firstName: 'Bob',
								lastName: 'Johnson',
								email: 'bob@lpa.gov.uk',
								lpaContact: 'lpa-2'
							}
						]
					}
				}
			},
			render: mock.fn()
		};
	});

	it('should create case with all data, send emails, and display success page', async () => {
		process.env.PORTAL_URL = 'http://localhost:3000';
		process.env.TEMPLATE_ID = 'template-123';

		const controller = buildSaveController(mockService);
		await controller(mockRequest, mockResponse, mock.fn());

		assert.strictEqual(mockService.db.case.create.mock.callCount(), 1);
		const caseData = mockService.db.case.create.mock.calls[0].arguments[0].data;

		assert.strictEqual(caseData.caseOfficer, 'John Doe');
		assert.strictEqual(caseData.planTitle, 'Development Plan 2024');
		assert.strictEqual(caseData.planType, 'Local Plan');
		assert.ok(caseData.reference.startsWith('PLAN/'));

		assert.ok(caseData.lpas);
		assert.ok(caseData.lpas.connectOrCreate);
		assert.strictEqual(caseData.lpas.connectOrCreate.length, 2);

		assert.ok(caseData.contacts);
		assert.ok(caseData.contacts.create);
		assert.strictEqual(caseData.contacts.create.length, 2);

		assert.strictEqual(mockService.notifyClient.sendEmail.mock.callCount(), 2);

		assert.strictEqual(mockResponse.render.mock.callCount(), 1);
		assert.strictEqual(mockResponse.render.mock.calls[0].arguments[0], 'views/layouts/success.njk');
	});
});
