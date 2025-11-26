import { BaseService } from '@pins/local-plans-lib/app/base-service.ts';
import type { Config } from './config.ts';

// Portal service extending BaseService with database, logging, and configuration
export class PortalService extends BaseService {
	constructor(config: Config) {
		super(config);
	}
}
