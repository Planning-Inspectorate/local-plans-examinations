import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Request } from 'express';
import type { ManageService } from '#service';
import {
	type AssessorGateway,
	FIRST_ASSESSOR_KEY,
	addGatewayAssessor,
	buildAssessorTabLocals,
	clearAssessorDraft,
	escapeHtml,
	getAssessorDraft,
	getAssessorRemoveUrl,
	getAssessorUrls,
	getGatewayAssessors,
	removeGatewayAssessor,
	resolveAssessorDisplayName,
	setAssessorDraft,
	toGatewayAssessors
} from './assessor-helper.ts';

const service = { authDisabled: true } as unknown as ManageService;

function requestWithSession(session: Record<string, unknown> = {}) {
	return { session } as unknown as Request;
}

describe('getAssessorUrls', () => {
	it('builds the Gateway 2 assessor urls', () => {
		assert.deepEqual(getAssessorUrls('PLAN-000001', 'gateway-2'), {
			tabUrl: '/case/PLAN-000001/gateway-2',
			baseUrl: '/case/PLAN-000001/gateway-2/assessor',
			questionUrl: '/case/PLAN-000001/gateway-2/assessor/assessors/assessor-gateway-2',
			checkUrl: '/case/PLAN-000001/gateway-2/assessor/check',
			removeUrl: '/case/PLAN-000001/gateway-2/assessor/remove'
		});
	});

	it('builds the Gateway 3 assessor urls', () => {
		assert.deepEqual(getAssessorUrls('PLAN-000001', 'gateway-3'), {
			tabUrl: '/case/PLAN-000001/gateway-3',
			baseUrl: '/case/PLAN-000001/gateway-3/assessor',
			questionUrl: '/case/PLAN-000001/gateway-3/assessor/assessors/gateway-3-assessor-name',
			checkUrl: '/case/PLAN-000001/gateway-3/assessor/check',
			removeUrl: '/case/PLAN-000001/gateway-3/assessor/remove'
		});
	});
});

describe('getAssessorRemoveUrl', () => {
	it('builds a remove url for each assessor of a gateway', () => {
		assert.equal(
			getAssessorRemoveUrl('PLAN-000001', 'gateway-2', FIRST_ASSESSOR_KEY),
			'/case/PLAN-000001/gateway-2/assessor/remove/first'
		);
		assert.equal(
			getAssessorRemoveUrl('PLAN-000001', 'gateway-3', 'assessor-row-id'),
			'/case/PLAN-000001/gateway-3/assessor/remove/assessor-row-id'
		);
	});
});

describe('assessor drafts', () => {
	it('keeps the chosen assessor separate for each case and gateway', () => {
		const req = requestWithSession();

		setAssessorDraft(req, 'PLAN-000001', 'gateway-2', 'assessor-1');
		setAssessorDraft(req, 'PLAN-000001', 'gateway-3', 'assessor-2');

		assert.equal(getAssessorDraft(req, 'PLAN-000001', 'gateway-2'), 'assessor-1');
		assert.equal(getAssessorDraft(req, 'PLAN-000001', 'gateway-3'), 'assessor-2');
		assert.equal(getAssessorDraft(req, 'PLAN-000002', 'gateway-2'), undefined);
	});

	it('treats a blank answer as no draft', () => {
		const req = requestWithSession();

		setAssessorDraft(req, 'PLAN-000001', 'gateway-2', '  ');

		assert.equal(getAssessorDraft(req, 'PLAN-000001', 'gateway-2'), undefined);
	});

	it('clears only the draft for the given case and gateway', () => {
		const req = requestWithSession();
		setAssessorDraft(req, 'PLAN-000001', 'gateway-2', 'assessor-1');
		setAssessorDraft(req, 'PLAN-000001', 'gateway-3', 'assessor-2');

		clearAssessorDraft(req, 'PLAN-000001', 'gateway-2');

		assert.equal(getAssessorDraft(req, 'PLAN-000001', 'gateway-2'), undefined);
		assert.equal(getAssessorDraft(req, 'PLAN-000001', 'gateway-3'), 'assessor-2');
	});

	it('does not fail when there is nothing to clear', () => {
		assert.doesNotThrow(() => clearAssessorDraft(requestWithSession(), 'PLAN-000001', 'gateway-2'));
	});
});

describe('resolveAssessorDisplayName', () => {
	it('uses the text of the matching question option', async () => {
		const name = await resolveAssessorDisplayName(service, requestWithSession(), 'gateway-2', 'assessor-1');

		assert.equal(name, 'Assessor 1');
	});

	it('falls back to the stored value when auth is disabled and there is no matching option', async () => {
		const name = await resolveAssessorDisplayName(service, requestWithSession(), 'gateway-3', 'Jo Bloggs');

		assert.equal(name, 'Jo Bloggs');
	});

	it('looks the name up in Entra when there is no matching option', async () => {
		const entraService = {
			authDisabled: false,
			getEntraClient: () => ({ getUserDisplayName: async (id: string) => `User ${id}` })
		} as unknown as ManageService;

		const name = await resolveAssessorDisplayName(entraService, requestWithSession(), 'gateway-2', 'entra-id');

		assert.equal(name, 'User entra-id');
	});

	it('falls back to the stored value when the Entra lookup fails', async () => {
		const entraService = {
			authDisabled: false,
			getEntraClient: () => ({
				getUserDisplayName: async () => {
					throw new Error('not found');
				}
			})
		} as unknown as ManageService;

		const name = await resolveAssessorDisplayName(entraService, requestWithSession(), 'gateway-2', 'entra-id');

		assert.equal(name, 'entra-id');
	});
});

const firstAppointed = new Date('2026-09-01T12:00:00.000Z');
const secondAppointed = new Date('2026-10-21T12:00:00.000Z');
const thirdAppointed = new Date('2026-11-05T12:00:00.000Z');

/** Additional assessors, deliberately not in the order they were added */
const additionalAssessors = [
	{
		id: 'row-3',
		assessorName: 'assessor-3',
		assessorAppointmentDate: thirdAppointed,
		createdDate: new Date('2026-11-05T12:00:00.000Z')
	},
	{
		id: 'row-2',
		assessorName: 'assessor-2',
		assessorAppointmentDate: secondAppointed,
		createdDate: new Date('2026-10-21T12:00:00.000Z')
	}
];

describe('toGatewayAssessors', () => {
	it('returns no assessors when none have been added', () => {
		assert.deepEqual(toGatewayAssessors(null), []);
		assert.deepEqual(toGatewayAssessors({ assessorName: null, assessorAppointmentDate: null }), []);
		assert.deepEqual(toGatewayAssessors({ assessorName: '', additionalAssessors: [] }), []);
	});

	it('lists the first assessor followed by the additional assessors in the order they were added', () => {
		const assessors = toGatewayAssessors({
			assessorName: 'assessor-1',
			assessorAppointmentDate: firstAppointed,
			additionalAssessors
		});

		assert.deepEqual(assessors, [
			{ key: FIRST_ASSESSOR_KEY, assessorName: 'assessor-1', assessorAppointmentDate: firstAppointed },
			{ key: 'row-2', assessorName: 'assessor-2', assessorAppointmentDate: secondAppointed },
			{ key: 'row-3', assessorName: 'assessor-3', assessorAppointmentDate: thirdAppointed }
		]);
	});
});

describe('buildAssessorTabLocals', () => {
	it('only provides the Add assessor link when there is no assessor', async () => {
		const locals = await buildAssessorTabLocals(service, requestWithSession(), 'PLAN-000001', 'gateway-2', {
			assessorName: null,
			assessorAppointmentDate: null,
			additionalAssessors: []
		});

		assert.deepEqual(locals, {
			assessorLink: '/case/PLAN-000001/gateway-2/assessor/assessors/assessor-gateway-2',
			assessors: []
		});
	});

	it('provides the assessor name, appointed date and remove link once an assessor is saved', async () => {
		const locals = await buildAssessorTabLocals(service, requestWithSession(), 'PLAN-000001', 'gateway-3', {
			assessorName: 'assessor-2',
			assessorAppointmentDate: secondAppointed
		});

		assert.equal(locals.assessorLink, '/case/PLAN-000001/gateway-3/assessor/assessors/gateway-3-assessor-name');
		assert.deepEqual(locals.assessors, [
			{
				number: 1,
				name: 'Assessor 2',
				appointedDate: '21 October 2026',
				removeLink: '/case/PLAN-000001/gateway-3/assessor/remove/first'
			}
		]);
	});

	it('numbers every assessor and gives each one its own remove link', async () => {
		const locals = await buildAssessorTabLocals(service, requestWithSession(), 'PLAN-000001', 'gateway-2', {
			assessorName: 'assessor-1',
			assessorAppointmentDate: firstAppointed,
			additionalAssessors
		});

		assert.equal(locals.assessorLink, '/case/PLAN-000001/gateway-2/assessor/assessors/assessor-gateway-2');
		assert.deepEqual(locals.assessors, [
			{
				number: 1,
				name: 'Assessor 1',
				appointedDate: '1 September 2026',
				removeLink: '/case/PLAN-000001/gateway-2/assessor/remove/first'
			},
			{
				number: 2,
				name: 'Assessor 2',
				appointedDate: '21 October 2026',
				removeLink: '/case/PLAN-000001/gateway-2/assessor/remove/row-2'
			},
			{
				number: 3,
				name: 'Assessor 3',
				appointedDate: '5 November 2026',
				removeLink: '/case/PLAN-000001/gateway-2/assessor/remove/row-3'
			}
		]);
	});
});

const GATEWAY_TABLES: Record<AssessorGateway, { info: string; assessor: string; infoIdField: string }> = {
	'gateway-2': { info: 'gateway2Info', assessor: 'gateway2Assessor', infoIdField: 'gateway2InfoId' },
	'gateway-3': { info: 'gateway3Info', assessor: 'gateway3Assessor', infoIdField: 'gateway3InfoId' }
};

/**
 * A fake database that only has the tables of the given gateway, so using the other gateway's tables would throw.
 * Every write is recorded as `table.operation` with its arguments.
 */
function fakeDatabase(gateway: AssessorGateway, info: Record<string, unknown> | null) {
	const tables = GATEWAY_TABLES[gateway];
	const writes: Record<string, unknown>[] = [];
	const reads: unknown[] = [];
	let transactions = 0;
	const record = (name: string) => async (args: unknown) => {
		writes.push({ [name]: args });
	};
	const db: any = {
		[tables.info]: {
			findUnique: async (args: unknown) => {
				reads.push(args);
				return info;
			},
			upsert: record(`${tables.info}.upsert`)
		},
		[tables.assessor]: {
			create: record(`${tables.assessor}.create`),
			delete: record(`${tables.assessor}.delete`)
		},
		$transaction: async (callback: (transaction: unknown) => Promise<unknown>) => {
			transactions++;
			return callback(db);
		}
	};
	return { db, writes, reads, transactionCount: () => transactions };
}

for (const gateway of ['gateway-2', 'gateway-3'] as const) {
	const tables = GATEWAY_TABLES[gateway];
	const infoWithFirstAssessor = {
		id: 'info-id',
		assessorName: 'assessor-1',
		assessorAppointmentDate: firstAppointed,
		additionalAssessors: []
	};
	const infoWithThreeAssessors = { ...infoWithFirstAssessor, additionalAssessors };

	describe(`${gateway} assessor database access`, () => {
		it('gets every assessor of the gateway from its own tables', async () => {
			const { db, reads, writes } = fakeDatabase(gateway, infoWithThreeAssessors);

			const assessors = await getGatewayAssessors(db, 'case-id', gateway);

			assert.deepEqual(
				assessors.map((assessor) => assessor.assessorName),
				['assessor-1', 'assessor-2', 'assessor-3']
			);
			assert.deepEqual(reads, [
				{
					where: { caseId: 'case-id' },
					select: { id: true, assessorName: true, assessorAppointmentDate: true, additionalAssessors: true }
				}
			]);
			assert.deepEqual(writes, []);
		});

		it('returns no assessors when the gateway has no data yet', async () => {
			const { db } = fakeDatabase(gateway, null);

			assert.deepEqual(await getGatewayAssessors(db, 'case-id', gateway), []);
		});

		it('saves the first assessor on the gateway info row', async () => {
			const details = { assessorName: 'assessor-2', assessorAppointmentDate: secondAppointed };

			for (const info of [null, { ...infoWithFirstAssessor, assessorName: null, assessorAppointmentDate: null }]) {
				const { db, writes } = fakeDatabase(gateway, info);

				await addGatewayAssessor(db, 'case-id', gateway, details);

				assert.deepEqual(writes, [
					{
						[`${tables.info}.upsert`]: {
							where: { caseId: 'case-id' },
							update: details,
							create: { caseId: 'case-id', ...details }
						}
					}
				]);
			}
		});

		it('adds another assessor without changing the existing assessors', async () => {
			const { db, writes } = fakeDatabase(gateway, infoWithFirstAssessor);
			const details = { assessorName: 'assessor-2', assessorAppointmentDate: secondAppointed };

			await addGatewayAssessor(db, 'case-id', gateway, details);

			assert.deepEqual(writes, [
				{ [`${tables.assessor}.create`]: { data: { [tables.infoIdField]: 'info-id', ...details } } }
			]);
		});

		it('removes the only assessor by clearing the gateway info row', async () => {
			const { db, writes } = fakeDatabase(gateway, infoWithFirstAssessor);
			const cleared = { assessorName: null, assessorAppointmentDate: null };

			const removed = await removeGatewayAssessor(db, 'case-id', gateway, FIRST_ASSESSOR_KEY);

			assert.equal(removed?.assessorName, 'assessor-1');
			assert.deepEqual(writes, [
				{
					[`${tables.info}.upsert`]: {
						where: { caseId: 'case-id' },
						update: cleared,
						create: { caseId: 'case-id', ...cleared }
					}
				}
			]);
		});

		it('removes an additional assessor and leaves the other assessors alone', async () => {
			const { db, writes } = fakeDatabase(gateway, infoWithThreeAssessors);

			const removed = await removeGatewayAssessor(db, 'case-id', gateway, 'row-3');

			assert.equal(removed?.assessorName, 'assessor-3');
			assert.deepEqual(writes, [{ [`${tables.assessor}.delete`]: { where: { id: 'row-3' } } }]);
		});

		it('moves the next assessor into first place when the first assessor is removed', async () => {
			const { db, writes, transactionCount } = fakeDatabase(gateway, infoWithThreeAssessors);
			const promoted = { assessorName: 'assessor-2', assessorAppointmentDate: secondAppointed };

			const removed = await removeGatewayAssessor(db, 'case-id', gateway, FIRST_ASSESSOR_KEY);

			assert.equal(removed?.assessorName, 'assessor-1');
			assert.equal(transactionCount(), 1);
			assert.deepEqual(writes, [
				{
					[`${tables.info}.upsert`]: {
						where: { caseId: 'case-id' },
						update: promoted,
						create: { caseId: 'case-id', ...promoted }
					}
				},
				{ [`${tables.assessor}.delete`]: { where: { id: 'row-2' } } }
			]);
		});

		it('does not remove anything when the assessor is not on the gateway', async () => {
			const { db, writes } = fakeDatabase(gateway, infoWithFirstAssessor);

			const removed = await removeGatewayAssessor(db, 'case-id', gateway, 'row-from-another-case');

			assert.equal(removed, null);
			assert.deepEqual(writes, []);
		});
	});
}

describe('escapeHtml', () => {
	it('escapes html special characters', () => {
		assert.equal(escapeHtml(`<b>"Jo" & 'Sam'</b>`), '&lt;b&gt;&quot;Jo&quot; &amp; &#39;Sam&#39;&lt;/b&gt;');
	});
});
