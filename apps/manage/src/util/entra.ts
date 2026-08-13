import { URL } from 'node:url';
import type { Client } from '@microsoft/microsoft-graph-client';

const PER_PAGE = 500; // max 999 per page
const MAX_PAGES = 10; // max 5000 entries

// odata reference properties and values
export const ODATA = Object.freeze({
	NEXT_LINK: '@odata.nextLink',
	TYPE: '@odata.type',
	GROUP_TYPE: '#microsoft.graph.group',
	USER_TYPE: '#microsoft.graph.user'
});

export interface GroupMember {
	id: string;
	displayName: string;
}

export interface User {
	id: string;
	displayName: string;
}
export class EntraClient {
	#client: Client;

	constructor(client: Client) {
		this.#client = client;
	}

	/**
	 * Fetch all group members - direct and indirect - of an Entra group, up to a maximum of 5000
	 *
	 */
	async listAllGroupMembers(groupId: string): Promise<GroupMember[]> {
		const listMembers = this.#client
			.api(`groups/${groupId}/transitiveMembers`)
			.select(['id', 'displayName'])
			.top(PER_PAGE);

		const members: GroupMember[] = [];
		for (let i = 0; i < MAX_PAGES; i++) {
			const res = await listMembers.get();
			members.push(
				...res.value.filter((v: GroupMember & { [key: string]: unknown }) => v[ODATA.TYPE] === ODATA.USER_TYPE)
			);

			const nextLink = res[ODATA.NEXT_LINK];
			if (!nextLink) {
				break;
			}
			// make the next request with the skipToken value to fetch the next page
			const token = EntraClient.extractSkipToken(nextLink);
			if (!token) {
				break;
			}
			listMembers.skipToken(token);
		}
		return members;
	}

	/**
	 * Get a skip token out of an '@odata.nextLink' value
	 */
	static extractSkipToken(link: string): string | undefined {
		const url = URL.parse(link);
		if (!url) {
			return undefined;
		}
		for (const [k, v] of url.searchParams) {
			if (k.toLowerCase() === '$skiptoken') {
				return v;
			}
		}
	}
	async getUserDisplayName(userId: string): Promise<string> {
		const user: User = await this.#client.api(`/users/${userId}`).select(['id', 'displayName']).top(1).get();
		return String(user.displayName);
	}
}
