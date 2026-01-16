import type { Request, Response } from 'express';

export function homePage(req: Request, res: Response): void {
	return res.render('views/home/view.njk', {
		pageHeading: 'Local Plans Examination Service'
	});
}
