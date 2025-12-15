import type { FormSessionData } from './types.ts';

/**
 * Session key used for storing form-related data in the user session.
 */
const SESSION_KEY = 'forms';

/**
 * Ensures that the form session object exists in the request session.
 */
const ensureSession = (req: any): void => {
	if (!req.session[SESSION_KEY]) {
		req.session[SESSION_KEY] = {};
	}
};

/**
 * Session manager for form operations
 */
export const SessionManager = {
	get(req: any): FormSessionData {
		return req.session?.[SESSION_KEY] || {};
	},

	store(req: any, submission: any): void {
		ensureSession(req);
		req.session[SESSION_KEY].reference = submission.reference;
		req.session[SESSION_KEY].submitted = true;
		delete req.session[SESSION_KEY].error;
	},

	setError(req: any, error: string): void {
		ensureSession(req);
		req.session[SESSION_KEY].error = error;
	},

	clear(req: any): void {
		if (req.session?.[SESSION_KEY]) {
			delete req.session[SESSION_KEY];
		}
	}
};

export const sessionStore = (req: any, data: any) => SessionManager.store(req, data);
export const sessionGet = (req: any) => SessionManager.get(req);
export const sessionClear = (req: any) => SessionManager.clear(req);
export const sessionSetError = (req: any, error: string) => SessionManager.setError(req, error);
