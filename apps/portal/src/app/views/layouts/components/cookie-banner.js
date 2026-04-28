/* global document */
/**
 * Cookie consent banner functionality
 * Handles user acceptance/rejection of analytics cookies and banner visibility
 */

const COOKIE_NAME = 'cookie_consent';
const COOKIE_DURATION_DAYS = 365;

/**
 * Set a cookie with the given name, value and expiry
 */
function setCookie(name, value, days) {
	const date = new Date();
	date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
	const expires = `expires=${date.toUTCString()}`;
	document.cookie = `${name}=${value};${expires};path=/;SameSite=Strict`;
}

/**
 * Get a cookie value by name
 */
function getCookie(name) {
	const nameEQ = `${name}=`;
	const cookies = document.cookie.split(';');
	for (let i = 0; i < cookies.length; i++) {
		let cookie = cookies[i];
		while (cookie.charAt(0) === ' ') {
			cookie = cookie.substring(1, cookie.length);
		}
		if (cookie.indexOf(nameEQ) === 0) {
			return cookie.substring(nameEQ.length, cookie.length);
		}
	}
	return null;
}

/**
 * Show the cookie banner
 */
function showCookieBanner() {
	const banner = document.querySelector('.govuk-cookie-banner');
	if (banner) {
		banner.removeAttribute('hidden');
	}
}

/**
 * Hide the cookie banner
 */
function hideCookieBanner() {
	const banner = document.querySelector('.govuk-cookie-banner');
	if (banner) {
		banner.setAttribute('hidden', 'hidden');
	}
}

/**
 * Show the initial cookie message
 */
function showCookieMessage() {
	const messages = document.querySelectorAll('.govuk-cookie-banner__message');
	if (messages.length > 0) {
		messages[0].removeAttribute('hidden');
	}
}

/**
 * Hide all cookie messages
 */
function hideAllMessages() {
	const messages = document.querySelectorAll('.govuk-cookie-banner__message');
	messages.forEach((message) => {
		message.setAttribute('hidden', 'hidden');
	});
}

/**
 * Show confirmation message based on user choice
 */
function showConfirmation(choice) {
	hideAllMessages();
	const confirmation = document.querySelector(`[data-cookie-confirmation="${choice}"]`);
	if (confirmation) {
		confirmation.removeAttribute('hidden');
	}
}

/**
 * Handle cookie consent choice
 */
function handleCookieChoice(choice) {
	setCookie(COOKIE_NAME, choice, COOKIE_DURATION_DAYS);
	showConfirmation(choice);
}

/**
 * Initialize cookie banner functionality
 */
function initCookieBanner() {
	const consent = getCookie(COOKIE_NAME);

	if (!consent) {
		showCookieBanner();
		showCookieMessage();
	}

	document.querySelectorAll('[data-cookie-action="accept"]').forEach((button) => {
		button.addEventListener('click', (e) => {
			e.preventDefault();
			handleCookieChoice('accept');
		});
	});

	document.querySelectorAll('[data-cookie-action="reject"]').forEach((button) => {
		button.addEventListener('click', (e) => {
			e.preventDefault();
			handleCookieChoice('reject');
		});
	});

	document.querySelectorAll('[data-cookie-action="hide"]').forEach((button) => {
		button.addEventListener('click', (e) => {
			e.preventDefault();
			hideCookieBanner();
		});
	});
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initCookieBanner);
} else {
	initCookieBanner();
}
