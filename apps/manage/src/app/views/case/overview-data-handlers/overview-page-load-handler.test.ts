import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { DocumentUtil } from '@pins/local-plans-lib/util/documents.ts';
import type { PageLoadContext } from './overview-page-load-handler.ts';
import { OverviewTabHandler } from './overview-tab-handler.ts';
import { Gateway1TabHandler } from './gateway-1-tab-handler.ts';
import { Gateway2TabHandler } from './gateway-2-tab-handler.ts';
import { Gateway3TabHandler } from './gateway-3-tab-handler.ts';
import { Gateway3SubmissionHandler } from './gateway-3-submission-handler.ts';
import { ExaminationTabHandler } from './examination-tab-handler.ts';

function buildContext(journeyId: string, reference: string, session = {}) {
	return {
		req: { method: 'GET', params: { reference }, query: {}, url: `/${journeyId}`, session },
		res: { locals: {}, redirect: () => {} },
		next: () => {},
		journeyId,
		reference,
		caseRecord: { id: reference, planTitle: reference },
		service: {
			authDisabled: true,
			db: {
				case: { findUnique: async () => ({ lpas: [], contacts: [] }) },
				gateway1Info: { findUnique: async () => ({}) },
				gateway2Info: { findUnique: async () => ({ workshops: [] }) },
				gateway3Info: { findUnique: async () => ({ submissions: [{ id: 'submission-1', createdAt: new Date(0) }] }) },
				examinationInfo: {
					findUnique: async () => ({
						hearings: [],
						planPauseHistory: reference === 'PLAN-123456' ? [{ planPauseDate: new Date(0) }] : []
					})
				},
				documentSet: {
					findMany: async ({ where }: { where: { folderName: { in: string[] } } }) =>
						where.folderName.in.map((folderName) => ({ id: folderName, folderName }))
				},
				document: { findMany: async () => [] }
			}
		}
	} as unknown as PageLoadContext;
}

describe('Case pause banners', () => {
	for (const [journeyId, Handler] of [
		['edit-case-overview', OverviewTabHandler],
		['gateway-1', Gateway1TabHandler],
		['gateway-2', Gateway2TabHandler],
		['gateway-3', Gateway3TabHandler],
		['gateway-3-report', Gateway3SubmissionHandler],
		['examination', ExaminationTabHandler]
	] as const) {
		it(`shows the ${journeyId} banner on first load without leaking it to another case`, async () => {
			const session = {};
			const makeContext = (reference: string) => buildContext(journeyId, reference, session);
			const handler = new Handler();
			const paused = makeContext('PLAN-123456');
			await handler.handle(paused);
			assert.equal(paused.res.locals.alerts?.length, 1);
			assert.equal(paused.res.locals.alerts[0].text, 'This examination is paused');
			assert.match(paused.res.locals.alerts[0].html, /href="\/case\/PLAN-123456\/examination"/);
			assert.equal(paused.req.session.alerts, undefined);

			const editing = makeContext('PLAN-123456');
			editing.req.params.question = 'existing-question';
			await handler.handle(editing);
			assert.equal(editing.res.locals.alerts, undefined);
			assert.equal(editing.req.session.alerts, undefined);

			const unpaused = makeContext('PLAN-654321');
			await handler.handle(unpaused);
			assert.equal(unpaused.res.locals.alerts, undefined);
			assert.equal(unpaused.req.session.alerts, undefined);
		});
	}
});

describe('Manage virus scan banners', () => {
	for (const [journeyId, Handler, folder] of [
		['gateway-1', Gateway1TabHandler, 'signed-sla'],
		['gateway-2', Gateway2TabHandler, 'gateway-2-report'],
		['gateway-2', Gateway2TabHandler, 'gateway-2-workshop-documents'],
		['gateway-3', Gateway3TabHandler, 'gateway-3-document-1'],
		['gateway-3-report', Gateway3SubmissionHandler, 'gateway-3-document-1'],
		['examination', ExaminationTabHandler, 'examination-report']
	] as const) {
		it(`loads ${folder} scan states in ${journeyId} and clears them after completion`, async () => {
			let status = 'affected';
			const loadFiles = mock.method(DocumentUtil, 'loadUploadedDocuments', async (_service, caseId, documentSetId) =>
				caseId === 'PLAN-123456' && documentSetId === folder
					? [
							{
								id: 'pending',
								fileName: 'pending.pdf',
								virusCheckStatus: status === 'affected' ? 'not_scanned' : status
							},
							{ id: 'infected', fileName: 'infected.pdf', virusCheckStatus: status }
						]
					: []
			);
			try {
				const handler = new Handler();
				const session = {};
				for (const [reference, scanStatus] of [
					['PLAN-123456', 'affected'],
					['PLAN-654321', 'affected'],
					['PLAN-123456', 'scanned']
				]) {
					status = scanStatus;
					const context = buildContext(journeyId, reference, session);
					if (journeyId === 'gateway-3-report') {
						context.req.params.question = 'gateway-3-document-1';
						context.req.url += '/gateway-3-document-1/check';
					}
					await handler.handle(context);
					const mixed = reference === 'PLAN-123456' && status === 'affected';
					assert.equal(context.res.locals.virusScanInProgress, mixed);
					assert.deepEqual(
						context.res.locals.virusErrorSummary,
						mixed
							? [
									{
										text: 'infected.pdf contains a virus. Remove the file and upload a different version.',
										href: '#uploaded-file-infected'
									}
								]
							: undefined
					);
				}
			} finally {
				loadFiles.mock.restore();
			}
		});
	}
});
