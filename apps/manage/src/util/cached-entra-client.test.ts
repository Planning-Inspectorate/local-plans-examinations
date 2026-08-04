import { CachedEntraClient, buildInitEntraClient } from './cached-entra-client.ts';
import { MapCache } from '@pins/local-plans-lib/util/map-cache.ts';
import { EntraClient } from './entra.ts';
import assert from 'node:assert';
import { describe, it, mock } from 'node:test';

function mockListAllGroupMembers(groupId: string) {
	switch (groupId) {
		case 'groupA':
			return [
				{
					id: '1',
					displayName: 'Alice'
				},
				{
					id: '2',
					displayName: 'Bob'
				}
			];
		case 'groupB':
			return [
				{
					id: '3',
					displayName: 'Charlie'
				},
				{
					id: '4',
					displayName: 'Dave'
				}
			];
		default:
			return [];
	}
}

describe('cached-entra-client', () => {
	describe('CachedEntraClient', () => {
		async function runTest(groupId: string, mapCacheDefaults: Map<string, any> = new Map()) {
			const entraClient = {
				listAllGroupMembers: mock.fn((groupId) => mockListAllGroupMembers(groupId))
			};
			const mapCache = new MapCache(10);
			mapCacheDefaults.forEach((value: any, key: string) => {
				mapCache.set(key, value);
			});
			const cachedEntraClient = new CachedEntraClient(entraClient as unknown as EntraClient, mapCache);
			const actualGroupDetails = await cachedEntraClient.listAllGroupMembers(groupId);
			const expectedGroupDetails = mockListAllGroupMembers(groupId);
			// Validate the return value
			assert.deepStrictEqual(actualGroupDetails, expectedGroupDetails);
			return entraClient;
		}
		it('Can fetch new entra ids using the CachedEntraClient', async () => {
			const entraClient = await runTest('groupA');
			// Validate that the EntraClient was called exaclty once
			assert(
				entraClient.listAllGroupMembers.mock.calls.length == 1,
				'Expected EntraClient.listAllGroupMembers to be called once'
			);
		});

		it('Uses the cached entra id when requerying the same group', async () => {
			const entraClient = await runTest(
				'groupB',
				new Map<string, any>([
					[
						'entra-group__groupB',
						[
							{
								id: '3',
								displayName: 'Charlie'
							},
							{
								id: '4',
								displayName: 'Dave'
							}
						]
					]
				])
			);
			// Validate that the EntraClient was called exaclty once
			assert(
				entraClient.listAllGroupMembers.mock.calls.length == 0,
				'Expected EntraClient.listAllGroupMembers to not be be called'
			);
		});
	});
});
