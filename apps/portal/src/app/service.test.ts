// @ts-nocheck

import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { DOCUMENT_SET_ID, gateway2SetIds } from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';
import { GATEWAY_3_DECISION_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';
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
					decision: null,
					completionDate: null
				}
			]
		},
		examinationInfo: {
			expectedSubmissionForExaminationDate: new Date('2026-09-01T12:00:00.000Z'),
			submissionForExaminationDate: null
		},
		documents: [],
		...overrides
	};
}

function buildGateway2ReportDocument(dateCreated = new Date('2026-09-02T12:00:00.000Z')) {
	return {
		guid: 'document-guid-1',
		name: 'Gateway 2 report',
		documentSetId: DOCUMENT_SET_ID.G2_REPORT,
		createdAt: new Date('2026-09-01T12:00:00.000Z'),
		isDeleted: false,
		latestDocumentVersion: {
			originalFilename: 'gateway-2-report.pdf',
			fileName: 'stored-gateway-2-report.pdf',
			dateCreated,
			isDeleted: false
		}
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
						documents: [{ documentSetId: DOCUMENT_SET_ID.G2_COVER_LETTER }]
					})
				),
				{
					stage: STAGE.Gateway2,
					status: STATUS.InProgress
				}
			);
		});

		it('returns Gateway 2 ready to start when the Gateway 2 report has been issued but not uploaded', () => {
			assert.deepStrictEqual(
				derivePlanProgress(
					buildCase({
						gateway2Info: {
							expectedDate: new Date('2026-07-21T12:00:00.000Z'),
							actualDate: null,
							reportIssuedDate: new Date('2026-09-01T12:00:00.000Z')
						}
					})
				),
				{
					stage: STAGE.Gateway2,
					status: STATUS.ReadyToStart
				}
			);
		});

		it('returns Gateway 2 ready to start when the Gateway 2 report has been uploaded but not issued', () => {
			assert.deepStrictEqual(
				derivePlanProgress(
					buildCase({
						documents: [buildGateway2ReportDocument()]
					})
				),
				{
					stage: STAGE.Gateway2,
					status: STATUS.ReadyToStart
				}
			);
		});

		it('returns Gateway 3 ready to start when the Gateway 2 report has been issued and uploaded', () => {
			assert.deepStrictEqual(
				derivePlanProgress(
					buildCase({
						gateway2Info: {
							expectedDate: new Date('2026-07-21T12:00:00.000Z'),
							actualDate: null,
							reportIssuedDate: new Date('2026-09-01T12:00:00.000Z')
						},
						documents: [buildGateway2ReportDocument()]
					})
				),
				{
					stage: STAGE.Gateway3,
					status: STATUS.ReadyToStart
				}
			);
		});

		it('returns Gateway 3 under review when actualDate is set but the decision is not complete', () => {
			assert.deepStrictEqual(
				derivePlanProgress(
					buildCase({
						gateway3Info: {
							expectedDate: new Date('2026-08-01T12:00:00.000Z'),
							actualDate: new Date('2026-10-01T12:00:00.000Z'),
							submissions: [{ decision: null, completionDate: null }]
						}
					})
				),
				{
					stage: STAGE.Gateway3,
					status: STATUS.UnderReview
				}
			);
		});

		it('returns Gateway 3 ready to start when a resubmission has been requested but not sent', () => {
			assert.deepStrictEqual(
				derivePlanProgress(
					buildCase({
						gateway3Info: {
							expectedDate: new Date('2026-08-01T12:00:00.000Z'),
							actualDate: new Date('2026-10-01T12:00:00.000Z'),
							submissions: [
								{
									decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED,
									completionDate: new Date('2026-10-15T12:00:00.000Z')
								},
								{ decision: null, completionDate: null }
							]
						}
					})
				),
				{
					stage: STAGE.Gateway3,
					status: STATUS.ReadyToStart
				}
			);
		});

		it('returns Gateway 3 under review when a requested resubmission has been sent', () => {
			assert.deepStrictEqual(
				derivePlanProgress(
					buildCase({
						gateway3Info: {
							expectedDate: new Date('2026-08-01T12:00:00.000Z'),
							actualDate: new Date('2026-10-20T12:00:00.000Z'),
							submissions: [
								{
									decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED,
									completionDate: new Date('2026-10-15T12:00:00.000Z')
								},
								{ decision: null, completionDate: null }
							]
						}
					})
				),
				{
					stage: STAGE.Gateway3,
					status: STATUS.UnderReview
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
									decision: GATEWAY_3_DECISION_ID.PROCEED_TO_EXAMINATION,
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
								in: gateway2SetIds
							}
						},
						orderBy: {
							createdAt: 'asc'
						},
						select: {
							guid: true,
							name: true,
							documentSetId: true,
							createdAt: true,
							isDeleted: true,
							latestDocumentVersion: {
								select: {
									originalFilename: true,
									fileName: true,
									dateCreated: true,
									isDeleted: true
								}
							}
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
			assert.strictEqual(plans[0].dates.G1, '7 May 2026');
			assert.strictEqual(plans[0].dates.G2, '21 July 2026');
			assert.strictEqual(plans[0].dates.G3, '1 August 2026');
			assert.strictEqual(plans[0].dates.E, '1 September 2026');
		});

		it('keeps Gateway 2 report issued-only cases at Gateway 2', async () => {
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

			assert.strictEqual(plans[0].stage, STAGE.Gateway2);
			assert.strictEqual(plans[0].status, STATUS.ReadyToStart);
			assert.strictEqual(plans[0].dates.G2, '21 July 2026');
		});

		it('keeps Gateway 2 report uploaded-only cases at Gateway 2', async () => {
			const service = buildService([
				buildCase({
					documents: [buildGateway2ReportDocument()]
				})
			]);

			const plans = await PortalService.prototype.getPlans.call(service, 'user@example.com');

			assert.strictEqual(plans[0].stage, STAGE.Gateway2);
			assert.strictEqual(plans[0].status, STATUS.ReadyToStart);
			assert.strictEqual(plans[0].dates.G2, '21 July 2026');
		});

		it('maps Gateway 2 report issued and uploaded cases to Gateway 3 plans', async () => {
			const service = buildService([
				buildCase({
					gateway2Info: {
						expectedDate: new Date('2026-07-21T12:00:00.000Z'),
						actualDate: null,
						reportIssuedDate: new Date('2026-09-01T12:00:00.000Z')
					},
					documents: [buildGateway2ReportDocument()]
				})
			]);

			const plans = await PortalService.prototype.getPlans.call(service, 'user@example.com');

			assert.strictEqual(plans[0].stage, STAGE.Gateway3);
			assert.strictEqual(plans[0].status, STATUS.ReadyToStart);
			assert.strictEqual(plans[0].dates.G2, '1 September 2026');
			assert.deepStrictEqual(plans[0].gateway2ReportFiles, [
				{
					fileName: 'gateway-2-report.pdf',
					documentGuid: 'document-guid-1',
					dateCreated: new Date('2026-09-02T12:00:00.000Z')
				}
			]);
		});

		it('maps a submitted Gateway 3 plan to Under review using its actual date', async () => {
			const actualDate = new Date('2026-10-01T12:00:00.000Z');
			const service = buildService([
				buildCase({
					gateway3Info: {
						expectedDate: new Date('2026-08-01T12:00:00.000Z'),
						actualDate,
						submissions: [{ decision: null, completionDate: null }]
					}
				})
			]);

			const plans = await PortalService.prototype.getPlans.call(service, 'user@example.com');

			assert.strictEqual(plans[0].stage, STAGE.Gateway3);
			assert.strictEqual(plans[0].status, STATUS.UnderReview);
			assert.strictEqual(plans[0].dates.G3, '1 October 2026');
		});

		it('maps an open Gateway 3 resubmission to Ready to start using the expected date', async () => {
			const service = buildService([
				buildCase({
					gateway3Info: {
						expectedDate: new Date('2026-08-01T12:00:00.000Z'),
						actualDate: new Date('2026-10-01T12:00:00.000Z'),
						submissions: [
							{
								decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED,
								completionDate: new Date('2026-10-15T12:00:00.000Z')
							},
							{ decision: null, completionDate: null }
						]
					}
				})
			]);

			const plans = await PortalService.prototype.getPlans.call(service, 'user@example.com');

			assert.strictEqual(plans[0].stage, STAGE.Gateway3);
			assert.strictEqual(plans[0].status, STATUS.ReadyToStart);
			assert.strictEqual(plans[0].dates.G3, '1 August 2026');
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
