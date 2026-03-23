import type { ManageService } from '#service';

export async function sendCaseAssignmentNotification(
	service: ManageService,
	recipientEmail: string,
	personalisation: {
		reference: string;
		caseName: string;
		frontOfficeLink: string;
		assignedUserName: string;
	}
): Promise<void> {
	if (!service.notifyClient) {
		service.logger.warn('Gov Notify not configured — skipping case assignment email');
		return;
	}
	await service.notifyClient.sendCaseAssignment(recipientEmail, personalisation);
}

export async function sendCaseUpdateNotification(
	service: ManageService,
	recipientEmail: string,
	personalisation: {
		reference: string;
		caseName: string;
		updateDescription: string;
		frontOfficeLink: string;
	}
): Promise<void> {
	if (!service.notifyClient) {
		service.logger.warn('Gov Notify not configured — skipping case update email');
		return;
	}
	await service.notifyClient.sendCaseUpdate(recipientEmail, personalisation);
}
