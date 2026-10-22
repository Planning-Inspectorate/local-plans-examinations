import type { Request, Response } from 'express';

export type AlertStruct = {
	type: string;
	text?: string;
	html?: string;
};

export function clearAlertsFromSession(req: Request) {
	delete req.session.alerts;
}

export function pushAlertToSession(req: Request, type: string, text?: string, html?: string) {
	const alerts: AlertStruct[] = req.session.alerts ?? [];
	// Html overrides the text, so if both are provided move the text into the html section
	const titleHtml = html && text ? `<p class="govuk-notification-banner__heading">${text}</p>` : '';
	const newAlert: AlertStruct = {
		type: type,
		text: text,
		html: html ? `${titleHtml}${html}` : undefined
	};
	const isDuplicate = alerts.some(
		(item) => item.type === newAlert.type && item.text === newAlert.text && item.html === newAlert.html
	);
	if (!isDuplicate) {
		alerts.push(newAlert);
		req.session.alerts = alerts;
	}
}

export function consumeAlertsFromSession(req: Request, res: Response) {
	if (!req.session.alerts) {
		return;
	}
	res.locals.alerts = req.session.alerts;
	clearAlertsFromSession(req);
}
