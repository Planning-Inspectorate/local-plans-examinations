declare module 'notifications-node-client' {
	export class NotifyClient {
		constructor(apiKey: string);
		sendEmail(templateId: string, emailAddress: string, options: object): Promise<unknown>;
		getNotificationById(notificationId: string): Promise<{ data: unknown }>;
	}
}
