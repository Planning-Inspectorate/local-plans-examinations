import type { Request } from 'express';
import type { PortalService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { createPortalForm } from '@pins/local-plans-lib';
import type { FormDataService } from '@pins/local-plans-lib';

// Helper functions for home page functionality
const checkDatabaseConnection = async (db: PortalService['db'], logger: PortalService['logger']): Promise<boolean> => {
	try {
		await db.$queryRaw`SELECT 1`;
		return true;
	} catch (error) {
		logger.error({ error }, 'Database connection failed');
		return false;
	}
};

const getTotalSubmissions = async (formService: FormDataService, logger: PortalService['logger']): Promise<number> => {
	try {
		return await formService.getTotalSubmissions();
	} catch (error) {
		logger.error({ error }, 'Failed to get total submissions');
		return 0;
	}
};

const updateVisitCount = (req: Request): number => {
	req.session.visits = (req.session.visits || 0) + 1;
	return req.session.visits;
};

// Home page handler with database health checks and visit tracking
const handleHomePage =
	(db: PortalService['db'], logger: PortalService['logger'], formService: FormDataService): AsyncRequestHandler =>
	async (req, res) => {
		const connected = await checkDatabaseConnection(db, logger);
		const visitCount = updateVisitCount(req);
		const totalSubmissions = await getTotalSubmissions(formService, logger);

		const viewModel = { connected, visitCount, totalSubmissions };
		logger.info({ viewModel }, 'Home Page View Model');

		return res.render('views/home/view.njk', {
			pageTitle: 'Local Plans Examination Service',
			...viewModel
		});
	};

// Factory for creating home page handler with dependency injection
export function buildHomePage(service: PortalService): AsyncRequestHandler {
	const { dataService } = createPortalForm(service);
	return handleHomePage(service.db, service.logger, dataService);
}
