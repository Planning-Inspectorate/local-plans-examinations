import type { Request, Response } from 'express';

export function logout(req: Request, res: Response): void {
	req.session.destroy(() => {
		res.redirect('/login');
	});
}
