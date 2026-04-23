import { BaseService } from '@pins/local-plans-lib/app/base-service.ts';
import { initGovNotify } from '@pins/local-plans-lib/govnotify/index.ts';
import type { GovNotifyClient } from '@pins/local-plans-lib/govnotify/index.ts';
import type { Config } from './config.ts';

export class PortalService extends BaseService {
	readonly notifyClient: GovNotifyClient | null;

	constructor(config: Config) {
		super(config);
		this.notifyClient = initGovNotify(config.govNotify, this.logger);
	}
}
