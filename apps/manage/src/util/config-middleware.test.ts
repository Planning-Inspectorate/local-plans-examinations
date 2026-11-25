import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { addLocalsConfiguration } from './config-middleware.ts';

describe('addLocalsConfiguration', () => {
	it('adds analytics ids to locals', () => {
		const res = {
			locals: {} as { config?: { clarityId?: string; googleAnalyticsId?: string } }
		};
		const next = mock.fn();

		addLocalsConfiguration('abc123', 'G-123')({} as any, res as any, next);

		assert.strictEqual(res.locals.config?.clarityId, 'abc123');
		assert.strictEqual(res.locals.config?.googleAnalyticsId, 'G-123');
		assert.strictEqual(next.mock.callCount(), 1);
	});
});
