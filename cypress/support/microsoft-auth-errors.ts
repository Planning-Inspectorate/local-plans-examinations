const microsoftAuthCdnHosts = new Set(['aadcdn.msauth.net', 'aadcdn.msftauth.net']);

export function isMicrosoftAuthCdnError(error: Error) {
	const urls = error.message.match(/https?:\/\/[^\s)"']+/g) ?? [];

	return urls.some((url) => {
		try {
			return microsoftAuthCdnHosts.has(new URL(url).hostname);
		} catch {
			return false;
		}
	});
}
