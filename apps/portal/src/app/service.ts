import { initGovNotify } from '@pins/local-plans-lib/govnotify/index.ts';
import type { GovNotifyClient } from '@pins/local-plans-lib/govnotify/index.ts';
import type { Config } from './config.ts';
import { buildTestPlans } from './types.ts';
import { Service } from '@pins/local-plans-lib/app/service.ts';

export class PortalService extends Service {
	readonly clarityId: string | undefined;
	readonly auth: Config['auth'];
	readonly environment: Config['environment'];
	readonly notifyClient: GovNotifyClient | null;

	constructor(config: Config) {
		super(config);
		this.auth = config.auth;
		this.environment = config.environment;
		this.clarityId = config.clarityId;
		this.notifyClient = initGovNotify(config.govNotify, this.logger);
	}

	async getPlans(): Promise<unknown[]> {
		// Replace with database query when ready, e.g.:
		// return await this.db.$queryRaw`SELECT * FROM plans WHERE ...`;
		return buildTestPlans();
	}
}
