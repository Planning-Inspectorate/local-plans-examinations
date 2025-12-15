import { createFormDataService } from './data-service.ts';
import { createFormService } from './service.ts';
import { FormControllerInterface, type RouteConfig } from './controller.ts';
import type { BaseService } from '@pins/local-plans-lib/app/base-service.ts';

export interface CoreServices {
	dataService: ReturnType<typeof createFormDataService>;
	businessService: ReturnType<typeof createFormService>;
}

/**
 * Creates core data and business services - completely generic
 */
export const createCoreServices = (service: BaseService): CoreServices => {
	const dataService = createFormDataService(service.db, service.logger);
	const businessService = createFormService(service.logger, dataService);

	return {
		dataService,
		businessService
	};
};

/**
 * Creates controller interface with provided configuration
 */
export const createControllerInterface = (
	businessService: ReturnType<typeof createFormService>,
	logger: any,
	routes: RouteConfig
): FormControllerInterface => {
	return new FormControllerInterface(businessService, logger, routes);
};
