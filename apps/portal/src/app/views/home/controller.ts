import type { PortalService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { QuestionnaireService as QuestionnaireDataService } from '../questionnaire/data/service.ts';

// Home page controller with database health checks and visit tracking
class HomeController {
	private readonly db: PortalService['db'];
	private readonly logger: PortalService['logger'];
	private readonly questionnaireService: any;

	constructor(db: PortalService['db'], logger: PortalService['logger'], questionnaireService: any) {
		this.db = db;
		this.logger = logger;
		this.questionnaireService = questionnaireService;
	}

	handleHomePage = async (req: any, res: any) => {
		const connected = await this.checkDatabaseConnection();
		const visitCount = this.updateVisitCount(req);
		const totalSubmissions = await this.getTotalSubmissions();

		const viewModel = { connected, visitCount, totalSubmissions };
		this.logger.info({ viewModel }, 'Home Page View Model');

		return res.render('views/home/view.njk', {
			pageTitle: 'Local Plans Examination Service',
			...viewModel
		});
	};

	private async checkDatabaseConnection(): Promise<boolean> {
		try {
			await this.db.$queryRaw`SELECT 1`;
			return true;
		} catch (error) {
			this.logger.error({ error }, 'Database connection failed');
			return false;
		}
	}

	private async getTotalSubmissions(): Promise<number> {
		try {
			return await this.questionnaireService.getTotalSubmissions();
		} catch (error) {
			this.logger.error({ error }, 'Failed to get total submissions');
			return 0; // Return 0 if database query fails
		}
	}

	private updateVisitCount(req: any): number {
		req.session.visits = (req.session.visits || 0) + 1;
		return req.session.visits;
	}
}

// Factory for creating home page handler with dependency injection
export function buildHomePage(service: PortalService): AsyncRequestHandler {
	const questionnaireDataService = new QuestionnaireDataService(service.db, service.logger);
	const controller = new HomeController(service.db, service.logger, questionnaireDataService);
	return controller.handleHomePage;
}
