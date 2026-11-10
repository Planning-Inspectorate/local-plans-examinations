import { Gateway3SubmissionHandler } from './gateway-3-submission-handler.ts';
import { type PageLoadContext } from './overview-page-load-handler.ts';
import { Gateway3SaveController } from '../save/gateway-3-save-controller.ts';
import { DocumentUtil } from '@pins/local-plans-lib/util/documents.ts';
import type { Request } from 'express';
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

describe('Test Gateway3SubmissionHandler', () => {
	describe('test handle', () => {
		const handler = new Gateway3SubmissionHandler();
		it('redirects if question is undefined', async () => {
			const context = {
				req: {
					params: {},
					session: {}
				} as Request,
				res: new Response(),
				service: {
					db: {}
				}
			} as any as PageLoadContext;
			context.res.redirect = mock.fn(async () => {});
			await handler.handle(context);
			assert.equal((context.res.redirect as any).mock?.calls?.length, 1);
		});

		it('creates submission 1 when the first decision is saved and no submission row exists', async (t) => {
			t.mock.method(DocumentUtil, 'loadUploadedDocuments', async () => []);
			const prepareAndSave = t.mock.method(Gateway3SaveController.prototype, 'prepareAndSave', async () => true);
			const redirect = mock.fn();
			const context = {
				req: {
					method: 'POST',
					params: { reference: 'PLAN-123456', section: 'gateway-3-submission-1', question: 'gateway-3-decision-1' },
					originalUrl: '/case/PLAN-123456/gateway-3-report/gateway-3-submission-1/gateway-3-decision-1',
					url: '/gateway-3-report/gateway-3-submission-1/gateway-3-decision-1',
					body: { 'decision-1': '1' },
					session: {}
				},
				res: { locals: {}, redirect },
				next: mock.fn(),
				journeyId: 'gateway-3-report',
				caseRecord: { id: 'case-id' },
				service: {
					db: {
						gateway3Info: { findUnique: async () => ({ id: 'gateway-3-info-id', caseId: 'case-id', submissions: [] }) },
						examinationInfo: { findUnique: async () => null },
						documentSet: {
							findMany: async ({ where }: { where: { folderName: { in: string[] } } }) =>
								where.folderName.in.map((folderName) => ({ id: folderName, folderName }))
						}
					}
				}
			} as unknown as PageLoadContext;

			await handler.handle(context);

			assert.equal(prepareAndSave.mock.callCount(), 1);
			const [{ submissions }] = prepareAndSave.mock.calls[0].arguments as [{ submissions: any[] }];
			assert.equal(submissions.length, 1);
			assert.equal(submissions[0].decision, '1');
			assert.equal(submissions[0].completionDate, null);
			assert.equal(submissions[0].gateway3InfoId, 'gateway-3-info-id');
			assert.deepEqual(redirect.mock.calls[0].arguments, [303, 'gateway-3-document-1']);
		});
	});
});
