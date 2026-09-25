// @ts-nocheck

import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { PortalService, derivePlanProgress } from './service.ts';
import { STAGE, STATUS } from './types.ts';

function buildCase(overrides = {}) {
	return {
		reference: 'PLAN-941623',
		planTitle: 'Real local plan',
		documents: [],
		lpas: [
			{ lpaName: 'Southampton City Council', lpaCode: 'SOTON' },
			{ lpaName: 'Romsey Town Council', lpaCode: 'ROMSEY' }
		],
		gateway1Info: {
			expectedGateway1Date: new Date('2026-05-07T12:00:00.000Z'),
			completedGateway1Date: null
		},
		gateway2Info: {
			expectedDate: new Date('2026-07-21T12:00:00.000Z'),
			actualDate: null,
			reportIssuedDate: null
		},
		gateway3Info: {
			expectedDate: new Date('2026-08-01T12:00:00.000Z'),
			actualDate: null,
			submissions: [
				{
					completionDate: null
				}
			]
		},
		examinationInfo: {
			expectedSubmissionForExaminationDate: new Date('2026-09-01T12:00:00.000Z'),
			submissionForExaminationDate: null
		},
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
	it('uses a portal-specific session cookie name', () => {
		assert.deepStrictEqual(PortalService.prototype.otherSessionOptions, { name: 'portal' });
	});

	describe('derivePlanProgress', () => {
		it('returns Gateway 2 ready to start', () => {
			assert.deepStrictEqual(derivePlanProgress(buildCase()), {
				stage: STAGE.Gateway2,
				status: STATUS.ReadyToStart
			});
		});

		it('returns Gateway 2 under review when actualDate is set but report not yet issued', () => {
			assert.deepStrictEqual(
				derivePlanProgress(
					buildCase({
						gateway2Info: {
							expectedDate: new Date('2026-07-21T12:00:00.000Z'),
							actualDate: new Date('2026-08-15T12:00:00.000Z'),
							reportIssuedDate: null
						}
					})
				),
				{
					stage: STAGE.Gateway2,
					status: STATUS.UnderReview
				}
			);
		});

		it('returns Gateway 2 in progress when a submission document has been created', () => {
			assert.deepStrictEqual(
				derivePlanProgress(
					buildCase({
						documents: [{ guid: 'document-guid' }]
					})
				),
				{
					stage: STAGE.Gateway2,
					status: STATUS.InProgress
				}
			);
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
							submissions: [
								{
									completionDate: new Date('2026-12-01T12:00:00.000Z')
								}
							]
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
					gateway1Info: {
						select: {
							expectedGateway1Date: true,
							completedGateway1Date: true
						}
					},
					gateway2Info: {
						select: {
							expectedDate: true,
							actualDate: true,
							reportIssuedDate: true
						}
					},
					gateway3Info: {
						select: {
							expectedDate: true,
							actualDate: true,
							submissions: true
						}
					},
					examinationInfo: {
						select: {
							expectedSubmissionForExaminationDate: true,
							submissionForExaminationDate: true
						}
					},
					lpas: {
						orderBy: {
							lpaName: 'asc'
						}
					},
					documents: {
						where: {
							documentSetId: {
								in: [
									'g2-cover-letter',
									'g2-timetable',
									'g2-init-doc',
									'g2-draft-stat-comp',
									'g2-draft-stat-sound',
									'g2-notice-intent',
									'g2-scoping-cons',
									'g2-cons-summ',
									'g2-g1-self-assess',
									'g2-cons-of-proposed',
									'g2-sum-of-cons',
									'g2-subsequent-work'
								]
							}
						},
						select: {
							guid: true
						},
						take: 1
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
			assert.strictEqual(plans[0].dates.G1, '7 May 2026');
			assert.strictEqual(plans[0].dates.G2, '21 July 2026');
			assert.strictEqual(plans[0].dates.G3, '1 August 2026');
			assert.strictEqual(plans[0].dates.E, '1 September 2026');
		});

		it('maps Gateway 2 report issued cases to Gateway 3 plans', async () => {
			const service = buildService([
				buildCase({
					gateway2Info: {
						expectedDate: new Date('2026-07-21T12:00:00.000Z'),
						actualDate: null,
						reportIssuedDate: new Date('2026-09-01T12:00:00.000Z')
					}
				})
			]);

			const plans = await PortalService.prototype.getPlans.call(service, 'user@example.com');

			assert.strictEqual(plans[0].stage, STAGE.Gateway3);
			assert.strictEqual(plans[0].status, STATUS.ReadyToStart);
			assert.strictEqual(plans[0].dates.G2, '1 September 2026');
		});

		it('maps missing info table dates to Not set', async () => {
			const service = buildService([
				buildCase({
					gateway1Info: null,
					gateway2Info: null,
					gateway3Info: null,
					examinationInfo: null
				})
			]);

			const plans = await PortalService.prototype.getPlans.call(service, 'user@example.com');

			assert.deepStrictEqual(plans[0].dates, {
				G1: 'Not set',
				G2: 'Not set',
				G3: 'Not set',
				E: 'Not set'
			});
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
