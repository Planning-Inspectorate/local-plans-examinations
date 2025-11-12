import 'express';

declare global {
	namespace Express {
		interface Request {
			journey?: any;
			questions?: any;
		}
	}
}
