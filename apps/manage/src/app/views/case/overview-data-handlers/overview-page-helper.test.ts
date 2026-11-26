import { describe, it, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import type { Request } from 'express';
import type { ManageService } from '#service';
import type { UploadedFile } from '@pins/local-plans-lib/storage/index.ts';
import { DocumentUtil } from '@pins/local-plans-lib/util/documents.ts';
import { fileUploadQuestionProperties } from '../questions.ts';
import { journeyFileUploadQuestionConfigs } from '../controller.ts';
import { addUploadedDocumentDetailsToAnswers } from './overview-page-helper.ts';

describe('OverviewPageHelper', () => {
	it('includes every FILE_UPLOADER question in a journey file upload config', () => {
		const journeyUploadUrls = new Set(
			Object.values(journeyFileUploadQuestionConfigs)
				.flat()
				.map((config) => config.url)
		);
		const missing = Object.entries(fileUploadQuestionProperties)
			.filter(
				([, question]) =>
					!journeyUploadUrls.has(question.url as string) &&
					!Object.values(journeyFileUploadQuestionConfigs)
						.flat()
						.some((config) => config.url.startsWith(question.url as string))
			)
			.map(([key, question]) => `${key} (${question.url})`);
		assert.deepEqual(missing, []);
	});

	for (const [journeyId, questionName] of [
		['gateway-1', 'signedSla'],
		['gateway-2', 'gateway2Report'],
		['gateway-2', 'gateway2WorkshopDocuments']
	] as const) {
		for (const hasDraft of [false, true]) {
			it(`loads saved ${questionName} files into answers and session${hasDraft ? ' alongside a draft' : ''}`, async (t) => {
				const question = fileUploadQuestionProperties[questionName];
				const service = {} as ManageService;
				const req = {
					params: { reference: 'PLAN-123456', question: question.url },
					url: `/${journeyId}/${question.url}`,
					session: {}
				} as unknown as Request;
				const savedFile: UploadedFile = {
					id: 'saved-file',
					fileName: 'saved.pdf',
					mimeType: 'application/pdf',
					size: 100,
					storageProvider: 'blob'
				};
				const draftFile = { ...savedFile, id: 'draft-file', fileName: 'draft.pdf' };
				t.mock.method(
					DocumentUtil,
					'getDocumentSetIdsByFolderName',
					async (_service: any, folderNames: string[]): Promise<Map<string, string>> =>
						new Map(journeyFileUploadQuestionConfigs[journeyId].map((config) => [config.url, config.url]))
				);
				t.mock.method(
					DocumentUtil,
					'loadUploadedDocuments',
					async (_service: any, caseId: string, documentSetId: string) =>
						caseId === 'case-id' && documentSetId === question.url ? [savedFile] : []
				);
				t.mock.method(
					DocumentUtil,
					'loadTempUploadedDocuments',
					async (_service: any, caseId: string, documentSetId: string) =>
						caseId === 'case-id' && documentSetId === question.url && hasDraft ? [draftFile] : []
				);
				const answers: Record<string, UploadedFile[]> = {};

				await addUploadedDocumentDetailsToAnswers(service, { id: 'case-id' }, req, answers, journeyId);

				const expected = hasDraft ? [savedFile, draftFile] : [savedFile];
				assert.deepEqual(answers[question.fieldName], expected);
				assert.deepEqual(req.session.fileUploader?.[`PLAN-123456:${question.fieldName}`]?.uploadedFiles, expected);
			});
		}
	}
});

describe('file uploader contents when visiting a page', () => {
	const CASE_ID = 'case-id';
	const REFERENCE = 'PLAN-123456';
	const fileFor = (kind: 'saved' | 'draft', setId: string): UploadedFile => ({
		id: `${kind}-${setId}`,
		fileName: `${kind}-${setId}.pdf`,
		mimeType: 'application/pdf',
		size: 100,
		storageProvider: 'blob'
	});

	function mockDocuments(t: TestContext, journeyId: string) {
		t.mock.method(
			DocumentUtil,
			'getDocumentSetIdsByFolderName',
			async () => new Map(journeyFileUploadQuestionConfigs[journeyId].map((config) => [config.url, config.url]))
		);
		t.mock.method(DocumentUtil, 'loadUploadedDocuments', async (_service: any, _caseId: string, setId: string) => [
			fileFor('saved', setId)
		]);
		t.mock.method(DocumentUtil, 'loadTempUploadedDocuments', async (_service: any, _caseId: string, setId: string) => [
			fileFor('draft', setId)
		]);
	}

	async function visit(journeyId: string, question: string, answers: Record<string, any>, suffix = '') {
		const req = {
			params: { reference: REFERENCE, question },
			url: `/${journeyId}/${question}${suffix}`,
			session: {}
		} as unknown as Request;
		await addUploadedDocumentDetailsToAnswers({} as ManageService, { id: CASE_ID }, req, answers, journeyId);
		return req;
	}

	const sessionFiles = (req: Request, fieldName: string) =>
		req.session.fileUploader?.[`${REFERENCE}:${fieldName}`]?.uploadedFiles;

	for (const [journeyId, configs] of Object.entries(journeyFileUploadQuestionConfigs)) {
		if (journeyId.startsWith('gateway-3')) continue;
		for (const { url, fieldName } of configs) {
			it(`${journeyId}: ${url} shows the saved file, and a draft only when revisiting from the check page`, async (t) => {
				mockDocuments(t, journeyId);
				const saved = fileFor('saved', url);
				const draft = fileFor('draft', url);

				const uploadAnswers: Record<string, any> = {};
				const uploadReq = await visit(journeyId, url, uploadAnswers);
				assert.deepEqual(uploadAnswers[fieldName], [saved, draft]);
				assert.deepEqual(sessionFiles(uploadReq, fieldName), [saved, draft]);

				const checkAnswers: Record<string, any> = {};
				const checkReq = await visit(journeyId, url, checkAnswers, '/check');
				assert.deepEqual(checkAnswers[fieldName], [saved]);
				assert.deepEqual(sessionFiles(checkReq, fieldName), [saved]);
			});
		}
	}

	describe('Gateway 3 documents', () => {
		const issued = {
			id: 'submission-1',
			decision: '2',
			completionDate: new Date('2026-10-01'),
			gateway3InfoId: CASE_ID
		};
		const open = { id: 'submission-2', decision: null, completionDate: null, gateway3InfoId: CASE_ID };

		for (const journeyId of ['gateway-3', 'gateway-3-report']) {
			it(`${journeyId}: the file uploader starts without the already uploaded resubmission documents`, async (t) => {
				mockDocuments(t, 'gateway-3');
				const answers: Record<string, any> = { submissions: [issued, open] };

				const req = await visit(journeyId, 'gateway-3-document-2', answers);

				const draft = [fileFor('draft', 'gateway-3-document-2')];
				assert.deepEqual(answers['gateway3Documents-2'], draft);
				assert.deepEqual(sessionFiles(req, 'gateway3Documents-2'), draft);
			});

			it(`${journeyId}: the check page shows the saved documents`, async (t) => {
				mockDocuments(t, 'gateway-3');
				const answers: Record<string, any> = { submissions: [issued, open] };

				await visit(journeyId, 'gateway-3-document-2', answers, '/check');

				assert.deepEqual(answers['gateway3Documents-2'], [fileFor('saved', 'gateway-3-document-2')]);
			});

			it(`${journeyId}: submission 1 documents load before any submission row exists`, async (t) => {
				mockDocuments(t, 'gateway-3');
				const answers: Record<string, any> = { submissions: [] };

				await visit(journeyId, 'gateway-3-document-1', answers, '/check');

				assert.deepEqual(answers['gateway3Documents-1'], [fileFor('saved', 'gateway-3-document-1')]);
				assert.equal(answers['gateway3Documents-2'], undefined);
			});
		}
	});
});
