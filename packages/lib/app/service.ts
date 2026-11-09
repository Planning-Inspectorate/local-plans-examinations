import { initDatabaseClient } from '@pins/local-plans-database';
import type { ConfigWithBlob } from './config-types.d.ts';
import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import { BlobFileStorageAdapter } from '@pins/local-plans-lib/storage/index.ts';
import { BaseService } from '@planning-inspectorate/core/app';

/**
 * This class encapsulates all the services and clients for the application
 */
export class Service extends BaseService<PrismaClient> {
	readonly #blobStorage: ConfigWithBlob['blobStorage'];
	readonly odw: ConfigWithBlob['odw'];

	constructor(config: ConfigWithBlob) {
		super(config, initDatabaseClient);
		this.#blobStorage = config.blobStorage;
		this.odw = config.odw;
	}

	createFileStorage(basePath?: string, containerName?: string): BlobFileStorageAdapter {
		return new BlobFileStorageAdapter({
			...this.#blobStorage,
			containerName: containerName ?? this.#blobStorage.containerName,
			basePath
		});
	}
}
