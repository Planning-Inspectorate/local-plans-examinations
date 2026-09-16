import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { PortalService } from '#service';

export function checkIsAuthenticated(req: Request, res: Response, next: NextFunction): void {
	if (req.session?.isAuthenticated) {
		next();
		return;
	}

	res.redirect('/login');
}

export function checkCaseOwnership(service: PortalService): RequestHandler {
	return async (req: Request, res: Response, next: NextFunction) => {
		const rawRef = req.params.planReference;
		const planReference = Array.isArray(rawRef) ? rawRef[0] : rawRef;
		if (!planReference) {
			return next();
		}

		const email = req.session?.authenticatedEmail;
		if (!email) {
			return res.redirect('/login');
		}

		const caseRecord = await service.db.case.findFirst({
			where: { reference: planReference, email }
		});

		if (!caseRecord) {
			return res.status(404).render('views/layouts/error', {
				pageTitle: 'Page not found',
				messages: [
					'If you typed the web address, check it is correct.',
					'If you pasted the web address, check you copied the entire address.'
				]
			});
		}

		return next();
	};
}
