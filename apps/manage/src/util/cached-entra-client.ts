import { Client } from '@microsoft/microsoft-graph-client';
import { EntraClient } from './entra.ts';
import type { GroupMember } from './entra.ts';
import type { MapCache } from '@planning-inspectorate/core/util';

export type InitEntraClient = (session: AuthSession) => CachedEntraClient | null;

export interface AuthSession {
	account?: {
		accessToken?: string;
	};
}

export type GroupCache = MapCache<GroupMember[]>;
export type UserCache = MapCache<string>;

export function buildInitEntraClient(
	authEnabled: boolean,
	groupCache: GroupCache,
	userCache: UserCache
): InitEntraClient {
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
		return new CachedEntraClient(entraClient, groupCache, userCache);
	};
}

/**
 * Wraps the EntraClient with a cache
 */
export class CachedEntraClient {
	#client: EntraClient;
	#groupCache: GroupCache;
	#userCache: UserCache;

	constructor(client: EntraClient, cache: GroupCache, userCache: UserCache) {
		this.#client = client;
		this.#groupCache = cache;
		this.#userCache = userCache;
	}

	/**
	 * Fetch all group members - direct and indirect - of an Entra group, up to a maximum of 5000
	 */
	async listAllGroupMembers(groupId: string): Promise<GroupMember[]> {
		let members = this.#groupCache.get(groupId);
		if (members) {
			return members;
		}
		members = await this.#client.listAllGroupMembers(groupId);
		this.#groupCache.set(groupId, members);
		return members;
	}

	async getUserDisplayName(userId: string): Promise<string> {
		let user = this.#userCache.get(userId);
		if (user) {
			return user;
		}
		user = await this.#client.getUserDisplayName(userId);
		this.#userCache.set(userId, user);
		return user;
	}
}
