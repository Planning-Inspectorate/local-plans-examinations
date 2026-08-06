import { Client } from '@microsoft/microsoft-graph-client';
import { EntraClient } from './entra.ts';
import type { GroupMember } from './entra.ts';
import type { MapCache } from '@pins/local-plans-lib/util/map-cache.ts';

export type InitEntraClient = (session: AuthSession) => CachedEntraClient | null;

export interface AuthSession {
	account?: {
		accessToken?: string;
	};
}

export function buildInitEntraClient(authEnabled: boolean, cache: MapCache): InitEntraClient {
	return (session: AuthSession) => {
		if (!authEnabled) {
			return null;
		}
		const accessToken = session.account?.accessToken;

		const client = Client.initWithMiddleware({
			authProvider: {
				async getAccessToken() {
					return accessToken ?? '';
				}
			}
		});
		const entraClient = new EntraClient(client);
		return new CachedEntraClient(entraClient, cache);
	};
}

/**
 * Wraps the EntraClient with a cache
 */
export class CachedEntraClient {
	#client: EntraClient;
	#cache: MapCache;

	constructor(client: EntraClient, cache: MapCache) {
		this.#client = client;
		this.#cache = cache;
	}

	/**
	 * Fetch all group members - direct and indirect - of an Entra group, up to a maximum of 5000
	 */
	async listAllGroupMembers(groupId: string): Promise<GroupMember[]> {
		let members = this.#cache.get(groupId);
		if (members) {
			return members;
		}
		members = await this.#client.listAllGroupMembers(groupId);
		this.#cache.set(groupId, members);
		return members;
	}
}
