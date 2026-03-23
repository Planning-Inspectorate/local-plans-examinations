import type { ManageService } from '#service';
import type { Handler } from 'express';

export function buildNotifyCallbackController(service: ManageService): Handler {
	return async (req, res) => {
		const { logger, notifyClient, db } = service;
		const notificationId = req.body?.id;
		if (!notificationId) {
			logger.warn('Missing notification ID in Notify callback');
			return res.status(400).send('Bad Request: Missing notification ID');
		}
		if (!notifyClient) {
			logger.warn('Notify client not configured');
			return res.status(500).send('Gov Notify not configured');
		}
		let notification: unknown;
		try {
			const response = await notifyClient.getNotificationById(notificationId);
			notification = response.data;
			if (!notification) return res.status(404).send('Notification not found');
		} catch (error) {
			logger.error({ error, notificationId }, 'Error fetching notification from Notify');
			return res.status(500).send('Gov Notify API call failed');
		}
		try {
			const n = notification as any;
			await db.notifyEmail.create({
				data: {
					notifyId: n.id,
					reference: n.reference ?? null,
					createdDate: n.created_at ? new Date(n.created_at) : null,
					completedDate: n.completed_at ? new Date(n.completed_at) : null,
					statusId: n.status,
					templateId: n.template?.id ?? null,
					templateVersion: n.template?.version ?? null,
					body: n.body ?? null,
					subject: n.subject ?? null,
					email: n.email_address ?? null
				}
			});
			logger.info({ notificationId }, 'Saved Notify callback to database');
			return res.status(200).send('OK');
		} catch (error) {
			logger.error({ error, notificationId }, 'Failed to save Notify callback');
			return res.status(500).send('Database operation failed');
		}
	};
}
