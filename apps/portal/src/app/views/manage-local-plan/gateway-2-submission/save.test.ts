import { buildSaveController } from './save.ts';
import { JOURNEY_ID } from './journey.ts';
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
			session: {
				forms: {
					[JOURNEY_ID]: {
						gateway2CoverLetter: [{ id: 'file-1', fileName: 'cover-letter.pdf' }]
					}
				}
			},
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

	it('should log the submitted answers and clear the journey session', async () => {
		process.env.PORTAL_URL = 'http://localhost:3000';
		process.env.TEMPLATE_ID = 'template-123';

		const controller = buildSaveController(mockService);
		await controller(mockRequest, mockResponse, mock.fn());

		assert.strictEqual(mockService.db.case.create.mock.callCount(), 0);
		assert.strictEqual(mockService.notifyClient.sendEmail.mock.callCount(), 0);
		assert.strictEqual(mockService.logger.info.mock.callCount(), 1);
		assert.strictEqual(mockRequest.session.forms[JOURNEY_ID], undefined);
		assert.strictEqual(mockResponse.render.mock.callCount(), 0);
	});
});
