import type { Request, Response, NextFunction } from 'express';
import type { ManageService } from '#service';

export interface JourneyDataLoadContext {
	req: Request;
	res: Response;
	next: NextFunction | undefined;
	service: ManageService;
	journeyId: string;
	reference: string;
	caseRecord: { id: string; planTitle: string | null };
}

export abstract class JourneyDataLoadHandler {
	public abstract handle(context: JourneyDataLoadContext): Promise<void>;
}
