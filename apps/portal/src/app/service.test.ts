import { PortalService } from '#service';

describe('PortalService', () => {
	it('uses a portal-specific session cookie name', () => {
		assert.deepStrictEqual(PortalService.prototype.otherSessionOptions, { name: 'portal' });
	});
});
