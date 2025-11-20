import { BaseService } from '@pins/local-plans-lib/app/base-service.ts';
import type { Config } from './config.ts';

/**
 * Portal service class that encapsulates all services and clients for the portal application
 *
 * Extends BaseService to provide database connections, logging, and configuration management
 * specifically tailored for the local plans examination portal.
 *
 * @extends {BaseService}
 *
 * @example
 * ```typescript
 * const config = loadConfig();
 * const service = new PortalService(config);
 *
 * // Access database
 * await service.db.questionnaire.findMany();
 *
 * // Use logger
 * service.logger.info('Portal started');
 * ```
 */
export class PortalService extends BaseService {
	/**
	 * Creates a new PortalService instance
	 *
	 * @param {Config} config - Application configuration including database, logging, and session settings
	 */
	constructor(config: Config) {
		super(config);
	}
}
