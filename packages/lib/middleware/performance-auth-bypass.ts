import type { Request } from 'express';

type PerformanceAuthRequest = Pick<Request, 'get' | 'method' | 'path'>;

export function isPerformanceTestAuthBypassRequest(req: PerformanceAuthRequest, allowedPaths: string[]) {
	if (process.env.ENVIRONMENT?.toLowerCase() !== 'test') {
		return false;
	}

	if (req.method !== 'GET' || !allowedPaths.includes(req.path)) {
		return false;
	}

	const expectedToken = process.env.PERFORMANCE_TEST_AUTH_TOKEN;

	return Boolean(expectedToken && req.get('X-Performance-Test-Auth') === expectedToken);
}
