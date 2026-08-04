import { BaseService } from '@pins/local-plans-lib/app/base-service.ts';
import { initGovNotify } from '@pins/local-plans-lib/govnotify/index.ts';
import type { GovNotifyClient } from '@pins/local-plans-lib/govnotify/index.ts';
import type { Config } from './config.ts';
import { MapCache } from '@pins/local-plans-lib/util/map-cache.ts';
import { buildInitEntraClient } from '#util/cached-entra-client.ts';
import type { InitEntraClient } from '#util/entra-groups.ts';

export class ManageService extends BaseService {
	#config: Config;
	readonly notifyClient: GovNotifyClient | null;
	readonly getEntraClient: InitEntraClient;

	constructor(config: Config) {
		super(config);
		this.#config = config;
		this.notifyClient = initGovNotify(config.govNotify, this.logger);
		const entraGroupCache = new MapCache(config.entra.cacheTtl);
		this.getEntraClient = buildInitEntraClient(!config.auth.disabled, entraGroupCache);
	}

	get authConfig(): Config['auth'] {
		return this.#config.auth;
	}

	get authDisabled(): boolean {
		return this.#config.auth.disabled;
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
