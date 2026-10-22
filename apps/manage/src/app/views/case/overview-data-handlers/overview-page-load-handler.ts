import type { Request, Response, NextFunction } from 'express';
import type { ManageService } from '#service';

export interface PageLoadContext {
	req: Request;
	res: Response;
	next: NextFunction | undefined;
	service: ManageService;
	journeyId: string;
	reference: string;
	caseRecord: { id: string; planTitle: string | null };
}

export abstract class OverviewPageLoadHandler {
	public abstract handle(context: PageLoadContext): Promise<void>;
	protected consumeAlertsFromSession(req: Request, res: Response) {
		if (req.session.alertMessage) {
			res.locals.alertMessage = req.session.alertMessage;
			delete req.session.alertMessage;
		}
		if (req.session.alertMessageStatus) {
			res.locals.alertMessageStatus = req.session.alertMessageStatus;
			delete req.session.alertMessageStatus;
		}
	}
}
