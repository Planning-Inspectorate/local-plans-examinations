import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { resolveExaminationWebsite, syncPortalExaminationWebsite } from './examination-website.ts';

describe('resolveExaminationWebsite', () => {
	it('uses the Portal examination submission ahead of everything else', () => {
		const website = resolveExaminationWebsite({
			examinationInfo: { examinationWebsite: 'www.manage.example', examinationWebsiteUrl: 'www.portal-exam.example' },
			gateway3Info: { examinationWebsiteUrl: 'www.portal-gw3.example' }
		});
		assert.equal(website, 'www.portal-exam.example');
	});

	it('uses the Portal Gateway 3 submission when there is no examination submission website', () => {
		const website = resolveExaminationWebsite({
			examinationInfo: { examinationWebsite: 'www.manage.example', examinationWebsiteUrl: null },
			gateway3Info: { examinationWebsiteUrl: 'www.portal-gw3.example' }
		});
		assert.equal(website, 'www.portal-gw3.example');
	});

	it('falls back to the address saved in Manage when the Portal has not submitted one', () => {
		const website = resolveExaminationWebsite({
			examinationInfo: { examinationWebsite: 'www.manage.example', examinationWebsiteUrl: null },
			gateway3Info: { examinationWebsiteUrl: null }
		});
		assert.equal(website, 'www.manage.example');
	});

	it('ignores blank values and trims the address', () => {
		const website = resolveExaminationWebsite({
			examinationInfo: { examinationWebsite: '  www.manage.example  ', examinationWebsiteUrl: '   ' },
			gateway3Info: { examinationWebsiteUrl: '' }
		});
		assert.equal(website, 'www.manage.example');
	});

	it('returns null when no address has been saved anywhere', () => {
		assert.equal(resolveExaminationWebsite({ examinationInfo: null, gateway3Info: null }), null);
		assert.equal(resolveExaminationWebsite({}), null);
	});
});

describe('syncPortalExaminationWebsite', () => {
	const createDb = () => ({
		examinationInfo: { updateMany: mock.fn(async () => ({ count: 1 })) },
		gateway3Info: { updateMany: mock.fn(async () => ({ count: 1 })) }
	});

	it('updates the website only where the Portal has already submitted one', async () => {
		const db = createDb();

		await syncPortalExaminationWebsite(db as any, 'case-id', '  www.changed-in-manage.example  ');

		const expectedQuery = {
			where: { caseId: 'case-id', examinationWebsiteUrl: { not: null } },
			data: { examinationWebsiteUrl: 'www.changed-in-manage.example' }
		};
		assert.deepEqual(db.examinationInfo.updateMany.mock.calls[0].arguments, [expectedQuery]);
		assert.deepEqual(db.gateway3Info.updateMany.mock.calls[0].arguments, [expectedQuery]);
	});

	it('does not touch the Portal answers when there is no website to save', async () => {
		const db = createDb();

		await syncPortalExaminationWebsite(db as any, 'case-id', '   ');
		await syncPortalExaminationWebsite(db as any, 'case-id', undefined);

		assert.equal(db.examinationInfo.updateMany.mock.callCount(), 0);
		assert.equal(db.gateway3Info.updateMany.mock.callCount(), 0);
	});
});
