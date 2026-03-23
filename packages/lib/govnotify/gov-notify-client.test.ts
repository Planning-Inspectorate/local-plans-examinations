import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { GovNotifyClient } from './gov-notify-client.ts';
import { mockLogger } from '../testing/mock-logger.ts';

describe('GovNotifyClient', () => {
	describe('sendEmail', () => {
		it('dispatches email and logs', async (ctx) => {
			const logger = mockLogger();
			const client = new GovNotifyClient(logger, 'key', {} as any);
			ctx.mock.method(client.notifyClient, 'sendEmail', () => {});
			await client.sendEmail('tpl', 'a@b.com', { personalisation: {} });
			assert.strictEqual(client.notifyClient.sendEmail.mock.callCount(), 1);
			assert.strictEqual(logger.info.mock.callCount(), 1);
		});
		it('throws and logs on failure', async (ctx) => {
			const logger = mockLogger();
			const client = new GovNotifyClient(logger, 'key', {} as any);
			ctx.mock.method(client.notifyClient, 'sendEmail', () => {
				throw new Error('API error');
			});
			await assert.rejects(() => client.sendEmail('tpl', 'a@b.com', { personalisation: {} }), {
				message: 'email failed to dispatch: API error'
			});
			assert.strictEqual(logger.error.mock.callCount(), 1);
		});
		it('logs errors from Notify API response body', async (ctx) => {
			const logger = mockLogger();
			const client = new GovNotifyClient(logger, 'key', {} as any);
			ctx.mock.method(client.notifyClient, 'sendEmail', () => {
				const error: any = new Error('Notify API error');
				error.response = { data: { errors: ['Error 1', 'Error 2'] } };
				throw error;
			});
			await assert.rejects(() => client.sendEmail('tpl', 'a@b.com', { personalisation: {} }), {
				message: 'email failed to dispatch: Notify API error'
			});
			assert.strictEqual(logger.error.mock.callCount(), 2);
		});
	});
	describe('sendCaseAssignment', () => {
		it('calls sendEmail with correct args', async (ctx) => {
			const logger = mockLogger();
			const client = new GovNotifyClient(logger, 'key', { caseAssignment: 'tpl-1' } as any);
			ctx.mock.method(client, 'sendEmail', () => {});
			await client.sendCaseAssignment('a@b.com', {
				reference: 'REF',
				caseName: 'Case',
				frontOfficeLink: 'http://x',
				assignedUserName: 'Alice'
			});
			const [tpl, email, opts] = client.sendEmail.mock.calls[0].arguments;
			assert.strictEqual(tpl, 'tpl-1');
			assert.strictEqual(email, 'a@b.com');
			assert.strictEqual(opts.reference, 'REF');
		});
	});
	describe('sendCaseUpdate', () => {
		it('calls sendEmail with correct args', async (ctx) => {
			const logger = mockLogger();
			const client = new GovNotifyClient(logger, 'key', { caseUpdate: 'tpl-2' } as any);
			ctx.mock.method(client, 'sendEmail', () => {});
			await client.sendCaseUpdate('a@b.com', {
				reference: 'REF',
				caseName: 'Case',
				updateDescription: 'Desc',
				frontOfficeLink: 'http://x'
			});
			const [tpl, , opts] = client.sendEmail.mock.calls[0].arguments;
			assert.strictEqual(tpl, 'tpl-2');
			assert.strictEqual(opts.reference, 'REF');
		});
	});
	describe('sendAuthCode', () => {
		it('calls sendEmail with correct args', async (ctx) => {
			const logger = mockLogger();
			const client = new GovNotifyClient(logger, 'key', { authCode: 'tpl-3' } as any);
			ctx.mock.method(client, 'sendEmail', () => {});
			await client.sendAuthCode('a@b.com', { authCode: '123456', expiryMinutes: '15' });
			const [tpl] = client.sendEmail.mock.calls[0].arguments;
			assert.strictEqual(tpl, 'tpl-3');
		});
	});
	describe('getNotificationById', () => {
		it('returns data on success', async (ctx) => {
			const logger = mockLogger();
			const client = new GovNotifyClient(logger, 'key', {} as any);
			ctx.mock.method(client.notifyClient, 'getNotificationById', () => ({ data: { id: 'n1' } }));
			const result = await client.getNotificationById('n1');
			assert.strictEqual(result.data.id, 'n1');
		});
		it('throws on failure', async (ctx) => {
			const logger = mockLogger();
			const client = new GovNotifyClient(logger, 'key', {} as any);
			ctx.mock.method(client.notifyClient, 'getNotificationById', () => {
				throw new Error('fail');
			});
			await assert.rejects(() => client.getNotificationById('n1'), { message: 'failed to fetch notification: fail' });
		});
	});
});
