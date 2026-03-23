import { BaseService } from '@pins/local-plans-lib/app/base-service.ts';
import { initGovNotify } from '@pins/local-plans-lib/govnotify/index.ts';
import type { GovNotifyClient } from '@pins/local-plans-lib/govnotify/index.ts';
import type { Config } from './config.ts';

export class ManageService extends BaseService {
	#config: Config;
	readonly notifyClient: GovNotifyClient | null;

	constructor(config: Config) {
		super(config);
		this.#config = config;
		this.notifyClient = initGovNotify(config.govNotify, this.logger);
	}

	get authConfig(): Config['auth'] {
		return this.#config.auth;
	}

	get authDisabled(): boolean {
		return this.#config.auth.disabled;
	}

	get webHookToken(): string {
		return this.#config.govNotify.webHookToken;
	}

	get notifyCallbackEnabled(): boolean {
		return this.#config.notifyCallbackEnabled;
	}
}
