import { initDatabaseClient } from '@pins/local-plans-database';
import { initLogger } from '../util/logger.ts';
import { initRedis } from '../redis/index.ts';
import type { BaseConfig } from './config-types.d.ts';
import type { Logger } from 'pino';
import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import type { RedisClient } from '../redis/redis-client.ts';
import { BlobFileStorageAdapter } from '@pins/local-plans-lib/storage/index.ts';

/**
 * This class encapsulates all the services and clients for the application
 */
export class BaseService {
	#config: BaseConfig;
	logger: Logger;
	dbClient: PrismaClient;
	redisClient: RedisClient | null;
	readonly #blobStorage: BaseConfig['blobStorage'];

	constructor(config: BaseConfig) {
		this.#config = config;
		const logger = initLogger(config);
		this.logger = logger;
		this.dbClient = initDatabaseClient(config, logger);
		this.redisClient = initRedis(config.session, logger);
		this.#blobStorage = config.blobStorage;
	}

	get cacheControl() {
		return this.#config.cacheControl;
	}

	/**
	 * Alias of dbClient
	 *
	 * @returns {import('@pins/local-plans-database/src/client/client.ts').PrismaClient}
	 */
	get db() {
		return this.dbClient;
	}

	createFileStorage(basePath?: string): BlobFileStorageAdapter {
		return new BlobFileStorageAdapter({
			...this.#blobStorage,
			basePath
		});
	}

	get gitSha() {
		return this.#config.gitSha;
	}

	get secureSession() {
		return this.#config.NODE_ENV === 'production';
	}

	get sessionSecret() {
		return this.#config.session.secret;
	}

	get staticDir() {
		return this.#config.staticDir;
	}
}
