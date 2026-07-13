import { BaseService } from '@pins/local-plans-lib/app/base-service.ts';
import { initGovNotify } from '@pins/local-plans-lib/govnotify/index.ts';
import { BlobFileStorageAdapter } from '@pins/local-plans-lib/storage/index.ts';
import type { GovNotifyClient } from '@pins/local-plans-lib/govnotify/index.ts';
import type { Config } from './config.ts';
import { buildTestPlans } from './types.ts';

export class PortalService extends BaseService {
	readonly notifyClient: GovNotifyClient | null;
	readonly #blobStorage: Config['blobStorage'];

	constructor(config: Config) {
		super(config);
		this.#blobStorage = config.blobStorage;
		this.notifyClient = initGovNotify(config.govNotify, this.logger);
	}

	createFileStorage(basePath?: string): BlobFileStorageAdapter {
		return new BlobFileStorageAdapter({
			...this.#blobStorage,
			basePath
		});
	}

	async getPlans(): Promise<unknown[]> {
		// Replace with database query when ready, e.g.:
		// return await this.db.$queryRaw`SELECT * FROM plans WHERE ...`;
		return buildTestPlans();
	}
}
