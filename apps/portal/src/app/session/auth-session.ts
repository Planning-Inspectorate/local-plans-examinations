import type { SessionData } from 'express-session';

type AuthSession = Pick<
	SessionData,
	'email' | 'isAuthenticated' | 'authenticatedEmail' | 'showNewCodeMessage' | 'caseReference'
>;

export function setLoginEmail(session: AuthSession, email: string): void {
	session.email = email;
}

export function clearLoginEmail(session: AuthSession): void {
	delete session.email;
}

export function completeAuthentication(session: AuthSession, email: string): void {
	session.isAuthenticated = true;
	session.authenticatedEmail = email;
	clearLoginEmail(session);
}

export function markNewCodeSent(session: AuthSession, email: string): void {
	session.caseReference = email;
	session.showNewCodeMessage = true;
}

export function consumeNewCodeMessage(session: AuthSession): boolean {
	const showNewCodeMessage = session.showNewCodeMessage || false;
	delete session.showNewCodeMessage;
	return showNewCodeMessage;
}
