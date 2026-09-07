import type { NextFunction, Request, Response } from 'express';

export function checkIsAuthenticated(req: Request, res: Response, next: NextFunction): void {
	if (req.session?.isAuthenticated) {
		next();
		return;
	}

	res.redirect('/login');
}
