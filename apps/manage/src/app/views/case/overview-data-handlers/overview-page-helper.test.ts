import { describe, it } from 'node:test';
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
					async () => new Map(journeyFileUploadQuestionConfigs[journeyId].map((config) => [config.url, config.url]))
				);
				t.mock.method(DocumentUtil, 'loadUploadedDocuments', async (_service, caseId, documentSetId) =>
					caseId === 'case-id' && documentSetId === question.url ? [savedFile] : []
				);
				t.mock.method(DocumentUtil, 'loadTempUploadedDocuments', async (_service, caseId, documentSetId) =>
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
