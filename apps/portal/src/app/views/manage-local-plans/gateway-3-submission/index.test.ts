import assert from 'node:assert';
import { describe, it } from 'node:test';
import { gateway3SubmissionRoutes } from './index.ts';

describe('gateway3SubmissionRoutes', () => {
	it('returns an express router with get, post and use methods', () => {
		const mockService = {
			createFileStorage: () => ({})
		} as any;
		const router = gateway3SubmissionRoutes(mockService);
		assert.strictEqual(typeof router.get, 'function');
		assert.strictEqual(typeof router.post, 'function');
		assert.strictEqual(typeof router.use, 'function');
	});
});
