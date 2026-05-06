export interface GovNotifyOptions {
	personalisation: Record<string, string>;
	reference?: string;
}

export interface TemplateIds {
	authCode: string;
	loginInvite: string;
}

export interface NotifyConfig {
	disabled: boolean;
	apiKey: string;
	webHookToken?: string;
	templateIds: Partial<TemplateIds>;
}

export interface AuthCodePersonalisation {
	[key: string]: string;
	authCode: string;
	expiryMinutes: string;
}

export interface LoginInvitePersonalisation {
	[key: string]: string;
	portalLoginURL: string;
}
