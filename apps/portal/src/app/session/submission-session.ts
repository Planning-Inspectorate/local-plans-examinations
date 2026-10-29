import type { SessionData } from 'express-session';

export function markEditingFromCheckAnswers(session: Pick<SessionData, 'editingFromCheckAnswers'>): void {
	session.editingFromCheckAnswers = true;
}
