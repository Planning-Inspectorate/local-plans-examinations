import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import type { Client } from '@microsoft/microsoft-graph-client';
import { EntraClient } from './entra.ts';

describe('entraid', () => {
	type MockGraphRequest = {
		select: (this: MockGraphRequest) => MockGraphRequest;
		top: (this: MockGraphRequest) => MockGraphRequest;
		get: () => Promise<{
			value: Array<{
				id: string;
				displayName: string;
				'@odata.type': string;
			}>;
		}>;
		skipToken: (this: MockGraphRequest) => MockGraphRequest;
	};

	describe('listAllGroupMembers', () => {
		it('Should return all fetched users from the graph API when the page size is not hit', async () => {
			const mockGraphRequest = {
				select: mock.fn(function (this: MockGraphRequest) {
					return this;
				}),
				top: mock.fn(function (this: MockGraphRequest) {
					return this;
				}),
				get: mock.fn(async () => ({
					value: [
						{ id: '1', displayName: 'Alice', '@odata.type': '#microsoft.graph.user' },
						{ id: '2', displayName: 'Bob', '@odata.type': '#microsoft.graph.user' },
						{ id: '3', displayName: 'Charlie', '@odata.type': '#microsoft.graph.user' }
					]
				})),
				skipToken: mock.fn(function (this: MockGraphRequest) {
					return this;
				})
			};
			const mockGraphClient = {
				api: mock.fn(() => mockGraphRequest)
			};
			const groupId = 'captainsGroup';
			const entraClient = new EntraClient(mockGraphClient as unknown as Client);
			const actualResult = await entraClient.listAllGroupMembers(groupId);
			const expectedApiCallArgs = [`groups/${groupId}/transitiveMembers`];
			// Assert that the graph API was correctly called
			assert(
				mockGraphClient.api.mock.calls.length > 0,
				`Expected GraphClient.api to be called with the argument '${expectedApiCallArgs}', but it was not called`
			);
			// Assert that the skipToken method was not called on the GraphClient
			assert(
				mockGraphRequest.skipToken.mock.calls.length == 0,
				'Expected the skipToken method of the GraphClient to not have been called'
			);
			assert.deepStrictEqual(mockGraphClient.api.mock.calls[0].arguments, expectedApiCallArgs);
			const expectedResult = [
				{ id: '1', displayName: 'Alice', '@odata.type': '#microsoft.graph.user' },
				{ id: '2', displayName: 'Bob', '@odata.type': '#microsoft.graph.user' },
				{ id: '3', displayName: 'Charlie', '@odata.type': '#microsoft.graph.user' }
			];
			assert.deepStrictEqual(actualResult, expectedResult);
		});
		it('Should return all fetched users from the graph API when the page size is exceeded', async () => {
			// Simulate multuple calls to the get() method
			let callCount = 0;
			const getSideEffects = [
				{
					value: [
						{ id: '1', displayName: 'Alice', '@odata.type': '#microsoft.graph.user' },
						{ id: '2', displayName: 'Bob', '@odata.type': '#microsoft.graph.user' }
					],
					'@odata.nextLink': 'https://graph.microsoft.com/v1.0/users?$top=5&$skiptoken=1'
				},
				{
					value: [{ id: '3', displayName: 'Charlie', '@odata.type': '#microsoft.graph.user' }]
				}
			];
			const mockGraphRequest = {
				select: mock.fn(function (this: MockGraphRequest) {
					return this;
				}),
				top: mock.fn(function (this: MockGraphRequest) {
					return this;
				}),
				get: mock.fn(async () => getSideEffects[callCount++]),
				skipToken: mock.fn(function (this: MockGraphRequest) {
					return this;
				})
			};
			const mockGraphClient = {
				api: mock.fn(() => mockGraphRequest)
			};
			const groupId = 'captainsGroup';
			const entraClient = new EntraClient(mockGraphClient as unknown as Client);
			const actualResult = await entraClient.listAllGroupMembers(groupId);
			const expectedApiCallArgs = [`groups/${groupId}/transitiveMembers`];
			// Assert that the graph API was correctly called
			assert(
				mockGraphClient.api.mock.calls.length > 0,
				`Expected GraphClient.api to be called with the argument '${expectedApiCallArgs}', but it was not called`
			);
			assert.deepStrictEqual(mockGraphClient.api.mock.calls[0].arguments, expectedApiCallArgs);
			// Assert that the skipToken method was called on the GraphClient
			assert(
				mockGraphRequest.skipToken.mock.calls.length > 0,
				'Expected the skipToken method of the GraphClient to have been called'
			);
			// Assert that the return value is correct
			const expectedResult = [
				{ id: '1', displayName: 'Alice', '@odata.type': '#microsoft.graph.user' },
				{ id: '2', displayName: 'Bob', '@odata.type': '#microsoft.graph.user' },
				{ id: '3', displayName: 'Charlie', '@odata.type': '#microsoft.graph.user' }
			];
			assert.deepStrictEqual(actualResult, expectedResult);
		});
	});
});
