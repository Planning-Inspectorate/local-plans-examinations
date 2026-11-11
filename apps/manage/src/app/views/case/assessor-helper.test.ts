import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Request } from 'express';
import type { ManageService } from '#service';
import {
	buildAssessorTabLocals,
	clearAssessorDraft,
	escapeHtml,
	getAssessorDraft,
	getAssessorUrls,
	getGateway2Assessor,
	getGateway3Assessor,
	resolveAssessorDisplayName,
	saveGateway2Assessor,
	saveGateway3Assessor,
	setAssessorDraft
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

describe('buildAssessorTabLocals', () => {
	it('only provides the Add assessor link when there is no assessor', async () => {
		const locals = await buildAssessorTabLocals(service, requestWithSession(), 'PLAN-000001', 'gateway-2', {
			assessorName: null,
			assessorAppointmentDate: null
		});

		assert.deepEqual(locals, {
			assessorLink: '/case/PLAN-000001/gateway-2/assessor/assessors/assessor-gateway-2',
			assessors: []
		});
	});

	it('provides the assessor name, appointed date and remove link once an assessor is saved', async () => {
		const locals = await buildAssessorTabLocals(service, requestWithSession(), 'PLAN-000001', 'gateway-3', {
			assessorName: 'assessor-2',
			assessorAppointmentDate: new Date('2026-10-21T12:00:00.000Z')
		});

		assert.deepEqual(locals.assessors, [
			{
				number: 1,
				name: 'Assessor 2',
				appointedDate: '21 October 2026',
				removeLink: '/case/PLAN-000001/gateway-3/assessor/remove'
			}
		]);
	});
});

/** A fake database that only has the given table, so using the other gateway's table would throw */
function fakeDatabase(table: 'gateway2Info' | 'gateway3Info') {
	const calls: Record<string, unknown>[] = [];
	const db = {
		[table]: {
			findUnique: async (args: Record<string, unknown>) => {
				calls.push({ findUnique: args });
				return { assessorName: 'assessor-1', assessorAppointmentDate: null };
			},
			upsert: async (args: Record<string, unknown>) => {
				calls.push({ upsert: args });
			}
		}
	} as any;
	return { db, calls };
}

const expectedGet = {
	findUnique: { where: { caseId: 'case-id' }, select: { assessorName: true, assessorAppointmentDate: true } }
};

describe('Gateway 2 assessor database access', () => {
	it('gets the assessor from gateway2Info only', async () => {
		const { db, calls } = fakeDatabase('gateway2Info');

		const assessor = await getGateway2Assessor(db, 'case-id');

		assert.equal(assessor?.assessorName, 'assessor-1');
		assert.deepEqual(calls, [expectedGet]);
	});

	it('saves the assessor to gateway2Info only', async () => {
		const { db, calls } = fakeDatabase('gateway2Info');
		const details = { assessorName: 'assessor-2', assessorAppointmentDate: new Date(0) };

		await saveGateway2Assessor(db, 'case-id', details);

		assert.deepEqual(calls, [
			{ upsert: { where: { caseId: 'case-id' }, update: details, create: { caseId: 'case-id', ...details } } }
		]);
	});
});

describe('Gateway 3 assessor database access', () => {
	it('gets the assessor from gateway3Info only', async () => {
		const { db, calls } = fakeDatabase('gateway3Info');

		const assessor = await getGateway3Assessor(db, 'case-id');

		assert.equal(assessor?.assessorName, 'assessor-1');
		assert.deepEqual(calls, [expectedGet]);
	});

	it('saves the assessor to gateway3Info only', async () => {
		const { db, calls } = fakeDatabase('gateway3Info');
		const details = { assessorName: null, assessorAppointmentDate: null };

		await saveGateway3Assessor(db, 'case-id', details);

		assert.deepEqual(calls, [
			{ upsert: { where: { caseId: 'case-id' }, update: details, create: { caseId: 'case-id', ...details } } }
		]);
	});
});

describe('escapeHtml', () => {
	it('escapes html special characters', () => {
		assert.equal(escapeHtml(`<b>"Jo" & 'Sam'</b>`), '&lt;b&gt;&quot;Jo&quot; &amp; &#39;Sam&#39;&lt;/b&gt;');
	});
});
