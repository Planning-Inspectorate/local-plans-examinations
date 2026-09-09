import { initGovNotify } from '@pins/local-plans-lib/govnotify/index.ts';
import type { GovNotifyClient } from '@pins/local-plans-lib/govnotify/index.ts';
import type { Config } from './config.ts';
import { MapCache } from '@planning-inspectorate/core/util';
import { buildInitEntraClient } from '#util/cached-entra-client.ts';
import type { InitEntraClient } from '#util/cached-entra-client.ts';
import { Service } from '@pins/local-plans-lib/app/service.ts';
import type { GroupMember } from '#util/entra.ts';

export class ManageService extends Service {
	#config: Config;
	readonly notifyClient: GovNotifyClient | null;
	readonly getEntraClient: InitEntraClient;

	constructor(config: Config) {
		super(config);
		this.#config = config;
		this.notifyClient = initGovNotify(config.govNotify, this.logger);
		const entraGroupCache = new MapCache<GroupMember[]>(config.entra.cacheTtl);
		const entraUserCache = new MapCache<string>(config.entra.cacheTtl);
		this.getEntraClient = buildInitEntraClient(!config.auth.disabled, entraGroupCache, entraUserCache);
	}

	get authConfig(): Config['auth'] {
		return this.#config.auth;
	}

	get authDisabled(): boolean {
		return this.#config.auth.disabled;
	}

	get authRateLimitConfig() {
		return this.#config.auth.rateLimit;
	}

	get entraGroupIds(): Config['entra']['groupIds'] {
		return this.#config.entra.groupIds;
	}

	get webHookToken(): string {
		return this.#config.govNotify.webHookToken;
	}

	get notifyCallbackEnabled(): boolean {
		return this.#config.notifyCallbackEnabled;
	}
}
