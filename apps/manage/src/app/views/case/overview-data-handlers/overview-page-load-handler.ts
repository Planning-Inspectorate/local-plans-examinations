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
}
