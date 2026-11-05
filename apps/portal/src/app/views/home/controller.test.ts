// @ts-nocheck

import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { configureNunjucks } from '../../nunjucks.ts';
import { buildGuidancePage } from './controller.ts';

describe('guidance page', () => {
	it('should render without error', async () => {
		const nunjucks = configureNunjucks();
		const mockRes = {
			render: mock.fn((view, data) => nunjucks.render(view, data))
		};
		const mockReq = {};
		const guidancePage = buildGuidancePage();
		await assert.doesNotReject(() => guidancePage(mockReq, mockRes));
		assert.strictEqual(mockRes.render.mock.callCount(), 1);
		assert.strictEqual(mockRes.render.mock.calls[0].arguments[0], 'views/home/guidance.njk');
	});
});
