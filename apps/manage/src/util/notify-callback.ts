import type { RequestHandler } from 'express';
import type { ManageService } from '#service';

export function buildNotifyCallbackTokenValidator(service: ManageService): RequestHandler {
	return async (req, res, next) => {
		const authHeader = req.headers.authorization;
		const token = authHeader?.split(' ')[1];
		if (!service.webHookToken) {
			service.logger.warn('webHookToken is not set in Notify callback');
			return res.status(500).send('Server configuration error');
		}
		if (!token || token !== service.webHookToken) {
			service.logger.warn('Invalid or missing authorization token in Notify callback');
			return res.status(401).send('Unauthorized access');
		}
		return next();
	};
}
