import { CachedEntraClient } from './cached-entra-client.ts';
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

function mockGetUserDisplayName(userId: string) {
	switch (userId) {
		case '1':
			return {
				id: '1',
				displayName: 'Tom Paris'
			};
		case '2':
			return {
				id: '2',
				displayName: 'Harry Kim'
			};
		default:
			return null;
	}
}

describe('cached-entra-client', () => {
	describe('CachedEntraClient', () => {
		async function runGroupTest(groupId: string, groupCacheDefaults: Map<string, any> = new Map()) {
			const entraClient = {
				listAllGroupMembers: mock.fn((groupId) => mockListAllGroupMembers(groupId)),
				getUserDisplayName: mock.fn((userId) => mockGetUserDisplayName(userId))
			};
			const groupCache = new MapCache(10);
			groupCacheDefaults.forEach((value: any, key: string) => {
				groupCache.set(key, value);
			});
			const cachedEntraClient = new CachedEntraClient(
				entraClient as unknown as EntraClient,
				groupCache,
				new MapCache(10)
			);
			const actualGroupDetails = await cachedEntraClient.listAllGroupMembers(groupId);
			const expectedGroupDetails = mockListAllGroupMembers(groupId);
			// Validate the return value
			assert.deepStrictEqual(actualGroupDetails, expectedGroupDetails);
			return entraClient;
		}

		async function runUserTest(userId: string, userCacheDefaults: Map<string, any> = new Map()) {
			const entraClient = {
				listAllGroupMembers: mock.fn((groupId) => mockListAllGroupMembers(groupId)),
				getUserDisplayName: mock.fn((userId) => mockGetUserDisplayName(userId))
			};
			const userCache = new MapCache(10);
			userCacheDefaults.forEach((value: any, key: string) => {
				userCache.set(key, value);
			});
			const cachedEntraClient = new CachedEntraClient(
				entraClient as unknown as EntraClient,
				new MapCache(10),
				userCache
			);
			const actualUserName = await cachedEntraClient.getUserDisplayName(userId);
			const expectedUserName = mockGetUserDisplayName(userId);
			// Validate the return value
			assert.deepStrictEqual(actualUserName, expectedUserName);
			return entraClient;
		}
		it('Can fetch new entra ids using the CachedEntraClient', async () => {
			const entraClient = await runGroupTest('groupA');
			// Validate that the EntraClient was called exaclty once
			assert(
				entraClient.listAllGroupMembers.mock.calls.length == 1,
				'Expected EntraClient.listAllGroupMembers to be called once'
			);
		});

		it('Uses the cached entra id when requerying the same group', async () => {
			const entraClient = await runGroupTest(
				'groupB',
				new Map<string, any>([
					[
						'groupB',
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
			// Validate that the EntraClient was not called
			assert(
				entraClient.listAllGroupMembers.mock.calls.length == 0,
				'Expected EntraClient.listAllGroupMembers to not be be called'
			);
		});
		it('Can fetch a user by their id', async () => {
			const entraClient = await runUserTest('1', new Map<string, any>());
			// Validate that the EntraClient was called exaclty once
			assert(
				entraClient.getUserDisplayName.mock.calls.length == 1,
				'Expected EntraClient.getUserDisplayName to be called once'
			);
		});
		it('Uses the cached displayName when querying the same user', async () => {
			const entraClient = await runUserTest(
				'1',
				new Map<string, any>([
					[
						'1',
						{
							id: '1',
							displayName: 'Tom Paris'
						}
					]
				])
			);
			// Validate that the EntraClient was not called
			assert(
				entraClient.getUserDisplayName.mock.calls.length == 0,
				'Expected EntraClient.getUserDisplayName to not be be called'
			);
		});
	});
});
