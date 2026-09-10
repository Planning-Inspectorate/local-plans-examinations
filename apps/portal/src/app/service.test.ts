// @ts-nocheck

import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { PortalService, derivePlanProgress } from './service.ts';
import { STAGE, STATUS } from './types.ts';

function buildCase(overrides = {}) {
	return {
		reference: 'PLAN-941623',
		planTitle: 'Real local plan',
		gateway1Date: new Date('2026-05-07T12:00:00.000Z'),
		gateway2Date: new Date('2026-07-21T12:00:00.000Z'),
		gateway3Date: new Date('2026-08-01T12:00:00.000Z'),
		submissionDate: null,
		lpas: [
			{ lpaName: 'Southampton City Council', lpaCode: 'SOTON' },
			{ lpaName: 'Romsey Town Council', lpaCode: 'ROMSEY' }
		],
		gateway2Info: {
			reportIssuedDate: null
		},
		gateway3Info: null,
		...overrides
	};
}

function buildService(caseRecords = []) {
	return {
		db: {
			case: {
				findMany: mock.fn(async () => caseRecords)
			}
		}
	};
}

describe('PortalService', () => {
	describe('derivePlanProgress', () => {
		it('returns Gateway 2 ready to start', () => {
			assert.deepStrictEqual(derivePlanProgress(buildCase()), {
				stage: STAGE.Gateway2,
				status: STATUS.ReadyToStart
			});
		});

		it('returns Gateway 3 ready to start when the Gateway 2 report has been issued', () => {
			assert.deepStrictEqual(
				derivePlanProgress(
					buildCase({
						gateway2Info: {
							reportIssuedDate: new Date('2026-09-01T12:00:00.000Z')
						}
					})
				),
				{
					stage: STAGE.Gateway3,
					status: STATUS.ReadyToStart
				}
			);
		});

		it('returns Examination ready to start when Gateway 3 has been completed', () => {
			assert.deepStrictEqual(
				derivePlanProgress(
					buildCase({
						gateway3Info: {
							actualDate: null,
							completionDate: new Date('2026-12-01T12:00:00.000Z')
						}
					})
				),
				{
					stage: STAGE.Examination,
					status: STATUS.ReadyToStart
				}
			);
		});
	});

	describe('getPlans', () => {
		it('loads plans from the database for the signed-in email', async () => {
			const service = buildService([buildCase()]);

			const plans = await PortalService.prototype.getPlans.call(service, 'user@example.com');

			assert.deepStrictEqual(service.db.case.findMany.mock.calls[0].arguments[0], {
				where: {
					deletedDate: null,
					email: 'user@example.com'
				},
				include: {
					gateway2Info: {
						select: {
							reportIssuedDate: true
						}
					},
					gateway3Info: {
						select: {
							actualDate: true,
							completionDate: true
						}
					},
					lpas: {
						orderBy: {
							lpaName: 'asc'
						}
					}
				},
				orderBy: {
					createdAt: 'desc'
				}
			});
			assert.strictEqual(plans.length, 1);
			assert.strictEqual(plans[0].refNum, 'PLAN-941623');
			assert.strictEqual(plans[0].title, 'Real local plan');
			assert.strictEqual(plans[0].leadLPA, 'Southampton City Council');
			assert.strictEqual(plans[0].linkedLPA, 'Romsey Town Council');
			assert.strictEqual(plans[0].stage, STAGE.Gateway2);
			assert.strictEqual(plans[0].status, STATUS.ReadyToStart);
			assert.strictEqual(plans[0].dates.G2, '21 July 2026');
		});

		it('maps Gateway 2 report issued cases to Gateway 3 plans', async () => {
			const service = buildService([
				buildCase({
					gateway2Info: {
						reportIssuedDate: new Date('2026-09-01T12:00:00.000Z')
					}
				})
			]);

			const plans = await PortalService.prototype.getPlans.call(service, 'user@example.com');

			assert.strictEqual(plans[0].stage, STAGE.Gateway3);
			assert.strictEqual(plans[0].status, STATUS.ReadyToStart);
			assert.strictEqual(plans[0].dates.G2, '1 September 2026');
		});

		it('queries non-deleted plans only when no signed-in email is supplied', async () => {
			const service = buildService([buildCase()]);

			await PortalService.prototype.getPlans.call(service);

			assert.deepStrictEqual(service.db.case.findMany.mock.calls[0].arguments[0].where, {
				deletedDate: null
			});
		});
	});
});
