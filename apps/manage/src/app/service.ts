import { BaseService } from '@pins/local-plans-lib/app/base-service.ts';
import type { Config } from './config.ts';
import { initLogger } from '@pins/local-plans-lib/util/logger.ts';
import { initDatabaseClient } from '@pins/local-plans-database';

/**
 * This class encapsulates all the services and clients for the application
 */
export class ManageService extends BaseService {
	/**
	 * @private
	 */
	#config: Config;

	constructor(config: Config) {
		super(config);
		this.#config = config;
		const logger = initLogger(config);
		this.logger = logger;
		this.dbClient = initDatabaseClient(config, logger);
	}

	get authConfig(): Config['auth'] {
		return this.#config.auth;
	}

	get authDisabled(): boolean {
		return this.#config.auth.disabled;
	}
}
