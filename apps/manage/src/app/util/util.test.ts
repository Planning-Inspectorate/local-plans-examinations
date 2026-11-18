import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import type { ManageService } from '#service';
import { getExaminingInspectorNames } from './util.ts';

type InspectorRequest = Parameters<typeof getExaminingInspectorNames>[2];

describe('getExaminingInspectorNames', () => {
	const request = { session: {} } as InspectorRequest;

	function createService(
		examinationInfo: Record<string, string | null> | null,
		names: Record<string, { givenName: string | null; surname: string | null }> = {}
	) {
		const entraClient = {
			getUserName: mock.fn(async (id: string) => names[id] ?? { givenName: null, surname: null })
		};
		const findUnique = mock.fn(async (_args: unknown) => (examinationInfo === null ? null : { examinationInfo }));
		const service = {
			getEntraClient: mock.fn((_session: unknown) => entraClient),
			db: { case: { findUnique } }
		};

		return { service, entraClient, findUnique };
	}

	it('looks up the name of each assigned examining inspector in order', async () => {
		const { service, entraClient, findUnique } = createService(
			{ examiningInspector1: 'inspector-1', examiningInspector2: null, examiningInspector3: 'inspector-3' },
			{
				'inspector-1': { givenName: 'Jane', surname: 'Smith' },
				'inspector-3': { givenName: 'Alex', surname: null }
			}
		);

		const result = await getExaminingInspectorNames(service as unknown as ManageService, 'PLAN-1', request);

		assert.deepStrictEqual(result, [
			{ firstName: 'Jane', lastName: 'Smith' },
			{ firstName: 'Alex', lastName: null }
		]);
		assert.deepStrictEqual(findUnique.mock.calls[0].arguments, [
			{
				where: { reference: 'PLAN-1' },
				select: {
					examinationInfo: {
						select: { examiningInspector1: true, examiningInspector2: true, examiningInspector3: true }
					}
				}
			}
		]);
		assert.deepStrictEqual(
			entraClient.getUserName.mock.calls.map(({ arguments: args }) => args[0]),
			['inspector-1', 'inspector-3']
		);
		assert.strictEqual(service.getEntraClient.mock.calls[0].arguments[0], request.session);
	});

	it('returns an empty list without querying the database when there is no Entra client', async () => {
		const { service, findUnique } = createService({ examiningInspector1: 'inspector-1' });
		service.getEntraClient.mock.mockImplementation(() => null);

		const result = await getExaminingInspectorNames(service as unknown as ManageService, 'PLAN-1', request);

		assert.deepStrictEqual(result, []);
		assert.strictEqual(findUnique.mock.callCount(), 0);
	});

	it('returns an empty list when the case cannot be found', async () => {
		const { service, entraClient } = createService(null);

		const result = await getExaminingInspectorNames(service as unknown as ManageService, 'PLAN-1', request);

		assert.deepStrictEqual(result, []);
		assert.strictEqual(entraClient.getUserName.mock.callCount(), 0);
	});

	it('rejects when an Entra name lookup fails', async () => {
		const { service, entraClient } = createService({ examiningInspector1: 'inspector-1' });
		entraClient.getUserName.mock.mockImplementation(async () => {
			throw new Error('Graph unavailable');
		});

		await assert.rejects(getExaminingInspectorNames(service as unknown as ManageService, 'PLAN-1', request), {
			message: 'Graph unavailable'
		});
	});
});
