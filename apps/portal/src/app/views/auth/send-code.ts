import type { PortalService } from '#service';

export async function sendAuthCodeNotification(
	service: PortalService,
	recipientEmail: string,
	personalisation: {
		authCode: string;
		expiryMinutes: string;
	}
): Promise<void> {
	if (!service.notifyClient) {
		service.logger.warn('Gov Notify not configured — skipping auth code email');
		return;
	}
	try {
		await service.notifyClient.sendAuthCode(recipientEmail, personalisation);
		service.logger.info({ email: recipientEmail }, 'Auth code notification sent successfully');
	} catch (error) {
		service.logger.error({ error, email: recipientEmail }, 'Failed to send auth code notification');
		throw new Error('Failed to send authentication code. Please try again later.', { cause: error });
	}
}
