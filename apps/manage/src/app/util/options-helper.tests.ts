import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { Request } from 'express';
import type { ManageService } from '#service';
import {
	loadCaseOfficerOptions,
	loadInspectorOptions,
	loadLpaOptions,
	retrieveCaseOfficers,
	retrieveDefaultCaseOfficers
} from './options-helper.ts';

const GROUP_IDS = { caseOfficers: 'case-officers-group', inspectors: 'inspectors-group' };

const members = [
	{ id: 'user-1', displayName: 'Alice Smith' },
	{ id: 'user-2', displayName: 'Bob Jones' }
];

type Member = (typeof members)[number];
type Authority = { id: string; name: string; pinsCode: string; status: string };

function createService({
	authDisabled = false,
	groupMembers = members,
	hasEntraClient = true,
	authorities = [] as { id: string; name: string; pinsCode: string; status: string }[]
} = {}) {
	const listAllGroupMembers = mock.fn<(groupId: string) => Promise<Member[]>>(async () => groupMembers);
	const getEntraClient = mock.fn<(session: unknown) => { listAllGroupMembers: typeof listAllGroupMembers } | null>(
		() => (hasEntraClient ? { listAllGroupMembers } : null)
	);
	const findMany = mock.fn<(args: unknown) => Promise<Authority[]>>(async () => authorities);

	const service = {
		authDisabled,
		entraGroupIds: GROUP_IDS,
		getEntraClient,
		db: { authority: { findMany } }
	};

	return { service: service as unknown as ManageService, getEntraClient, listAllGroupMembers, findMany };
}

const createReq = () => ({ session: { account: {} } }) as unknown as Request;

const blankOption = { value: '', text: '' };
const memberOptions = [
	{ value: 'user-1', text: 'Alice Smith' },
	{ value: 'user-2', text: 'Bob Jones' }
];

describe('options-helper', () => {
	describe('loadCaseOfficerOptions', () => {
		it('does nothing when auth is disabled', async () => {
			const { service, getEntraClient } = createService({ authDisabled: true });
			const questions: Record<string, any> = { caseOfficer: { options: ['untouched'] } };

			await loadCaseOfficerOptions(service, createReq(), questions);

			assert.deepEqual(questions.caseOfficer.options, ['untouched']);
			assert.equal(getEntraClient.mock.callCount(), 0);
		});

		it('fetches members of the case officers group using the request session', async () => {
			const { service, getEntraClient, listAllGroupMembers } = createService();
			const req = createReq();

			await loadCaseOfficerOptions(service, req, { caseOfficer: {} });

			assert.equal(getEntraClient.mock.calls[0].arguments[0], req.session);
			assert.equal(listAllGroupMembers.mock.callCount(), 1);
			assert.equal(listAllGroupMembers.mock.calls[0].arguments[0], GROUP_IDS.caseOfficers);
		});

		it('sets options to a blank option followed by each case officer', async () => {
			const { service } = createService();
			const questions: Record<string, any> = { caseOfficer: {} };

			await loadCaseOfficerOptions(service, createReq(), questions);

			assert.deepEqual(questions.caseOfficer.options, [blankOption, ...memberOptions]);
		});

		it('sets only the blank option when there is no Entra client', async () => {
			const { service, listAllGroupMembers } = createService({ hasEntraClient: false });
			const questions: Record<string, any> = { caseOfficer: {} };

			await loadCaseOfficerOptions(service, createReq(), questions);

			assert.deepEqual(questions.caseOfficer.options, [blankOption]);
			assert.equal(listAllGroupMembers.mock.callCount(), 0);
		});
	});

	describe('loadInspectorOptions', () => {
		const inspectorQuestions = () => ({
			examiningInspector1: {} as any,
			examiningInspector2: {} as any,
			examiningInspector3: {} as any
		});

		it('does nothing when auth is disabled', async () => {
			const { service, getEntraClient } = createService({ authDisabled: true });
			const questions = inspectorQuestions();

			await loadInspectorOptions(service, createReq(), questions);

			assert.equal(questions.examiningInspector1.options, undefined);
			assert.equal(questions.examiningInspector2.options, undefined);
			assert.equal(questions.examiningInspector3.options, undefined);
			assert.equal(getEntraClient.mock.callCount(), 0);
		});

		it('fetches members of the inspectors group', async () => {
			const { service, listAllGroupMembers } = createService();

			await loadInspectorOptions(service, createReq(), inspectorQuestions());

			assert.equal(listAllGroupMembers.mock.callCount(), 1);
			assert.equal(listAllGroupMembers.mock.calls[0].arguments[0], GROUP_IDS.inspectors);
		});

		it('sets the same options on all three inspector questions', async () => {
			const { service } = createService();
			const questions = inspectorQuestions();

			await loadInspectorOptions(service, createReq(), questions);

			const expected = [blankOption, ...memberOptions];
			assert.deepEqual(questions.examiningInspector1.options, expected);
			assert.deepEqual(questions.examiningInspector2.options, expected);
			assert.deepEqual(questions.examiningInspector3.options, expected);
		});

		it('sets only the blank option when there is no Entra client', async () => {
			const { service } = createService({ hasEntraClient: false });
			const questions = inspectorQuestions();

			await loadInspectorOptions(service, createReq(), questions);

			assert.deepEqual(questions.examiningInspector1.options, [blankOption]);
			assert.deepEqual(questions.examiningInspector2.options, [blankOption]);
			assert.deepEqual(questions.examiningInspector3.options, [blankOption]);
		});
	});

	describe('retrieveCaseOfficers', () => {
		it('returns the default case officers when auth is disabled', async () => {
			const { service, getEntraClient } = createService({ authDisabled: true });

			const result = await retrieveCaseOfficers(service, {} as any);

			assert.deepEqual(result, retrieveDefaultCaseOfficers());
			assert.equal(getEntraClient.mock.callCount(), 0);
		});

		it('maps case officer group members to options (no blank option)', async () => {
			const { service, listAllGroupMembers } = createService();

			const result = await retrieveCaseOfficers(service, {} as any);

			assert.deepEqual(result, memberOptions);
			assert.equal(listAllGroupMembers.mock.calls[0].arguments[0], GROUP_IDS.caseOfficers);
		});

		it('passes the given session to getEntraClient', async () => {
			const { service, getEntraClient } = createService();
			const session = { account: { id: 'me' } } as any;

			await retrieveCaseOfficers(service, session);

			assert.equal(getEntraClient.mock.calls[0].arguments[0], session);
		});

		it('returns an empty array when there is no Entra client', async () => {
			const { service } = createService({ hasEntraClient: false });

			const result = await retrieveCaseOfficers(service, {} as any);

			assert.deepEqual(result, []);
		});
	});

	describe('retrieveDefaultCaseOfficers', () => {
		it('returns a blank option followed by three placeholder officers', () => {
			assert.deepEqual(retrieveDefaultCaseOfficers(), [
				{ value: '', text: '' },
				{ value: 'officer-1', text: 'Case Officer 1' },
				{ value: 'officer-2', text: 'Case Officer 2' },
				{ value: 'officer-3', text: 'Case Officer 3' }
			]);
		});
	});

	describe('loadLpaOptions', () => {
		it('returns placeholder LPAs and skips the database when auth is disabled', async () => {
			const { service, findMany } = createService({ authDisabled: true });

			const options = await loadLpaOptions(service);

			assert.deepEqual(options, [
				{ value: 'lpa-1', text: 'Local Planning Authority 1' },
				{ value: 'lpa-2', text: 'Local Planning Authority 2' },
				{ value: 'lpa-3', text: 'Local Planning Authority 3' }
			]);
			assert.equal(findMany.mock.callCount(), 0);
		});

		it('queries authorities ordered by name ascending', async () => {
			const { service, findMany } = createService();

			await loadLpaOptions(service);

			assert.equal(findMany.mock.callCount(), 1);
			assert.deepEqual(findMany.mock.calls[0].arguments[0], { orderBy: { name: 'asc' } });
		});

		it('maps pinsCode to value and name to text, keeping the database order', async () => {
			const { service } = createService({
				authorities: [
					{ id: 'id-1', name: 'Ashbourne Vale District Council', pinsCode: 'Q0001', status: 'live' },
					{ id: 'id-2', name: 'Brackenridge Borough Council', pinsCode: 'Q0002', status: 'live' }
				]
			});

			const options = await loadLpaOptions(service);

			assert.deepEqual(options, [
				{ value: 'Q0001', text: 'Ashbourne Vale District Council' },
				{ value: 'Q0002', text: 'Brackenridge Borough Council' }
			]);
		});

		it('returns an empty array when there are no authorities', async () => {
			const { service } = createService({ authorities: [] });

			const options = await loadLpaOptions(service);

			assert.deepEqual(options, []);
		});
	});
});
