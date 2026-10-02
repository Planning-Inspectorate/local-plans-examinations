import { PortalService } from '#service';
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('PortalService', () => {
	it('uses a portal-specific session cookie name', () => {
		assert.deepStrictEqual(PortalService.prototype.otherSessionOptions, { name: 'portal' });
	});
});
