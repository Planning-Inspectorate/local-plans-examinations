import { BaseService } from '@pins/local-plans-examinations-lib/app/base-service.ts';
import { HelloWorldService } from '@pins/local-plans-examinations-lib/services/hello-world.service.ts';
import type { Config } from './config.ts';

/**
 * This class encapsulates all the services and clients for the application
 */
export class PortalService extends BaseService {
	#helloWorldService: HelloWorldService;

	constructor(config: Config) {
		super(config);
		this.#helloWorldService = new HelloWorldService(this);
	}

	get helloWorldService(): HelloWorldService {
		return this.#helloWorldService;
	}
}
