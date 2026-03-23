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
	await service.notifyClient.sendAuthCode(recipientEmail, personalisation);
}
