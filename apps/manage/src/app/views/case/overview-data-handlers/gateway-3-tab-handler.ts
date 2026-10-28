import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { OverviewPageLoadHandler, type PageLoadContext } from './overview-page-load-handler.ts';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';
import { addUploadedDocumentDetailsToAnswers } from './overview-page-helper.ts';
import { getParam } from '../controller.ts';
import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import {
	DOCUMENT_LABELS,
	OPTIONAL_DOCUMENT_SETS,
	REQUIRED_DOCUMENT_SETS
} from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';
import { consumeAlertsFromSession } from '../../../util/alert.ts';

type Gateway3Answers = {
	id: string;
	caseId: string;
	expectedSubmissionForExaminationDate?: Date | null;
	submissionForExaminationDate?: Date | null;
	examiningInspector1?: string | null;
	examiningInspector2?: string | null;
	examiningInspector3?: string | null;
	examiningInspectorAppointmentDate?: Date | null;
	examinationWebsite?: string | null;
};

export type CompiledGateway3Answers = Gateway3Answers & {
	optionalData: {
		[k: string]: string;
	};
};

/**
 * Compiles data for Gateway3 by retrieving and organizing relevant document information
 * for a specified case. It fetches documents from the database, groups them by their
 * document set IDs, and maps them to their corresponding fields based on predefined
 * required and optional document sets.
 *
 * @param {PrismaClient} db - The database client used to fetch document data.
 * @param {Gateway3Answers} currentData - The existing Gateway3 data that will be supplemented
 * with compiled document information.
 * @returns {Promise<CompiledGateway3Answers>} A promise that resolves to the compiled
 * Gateway3 data including document information grouped and formatted by required
 * and optional sets.
 */
export const compileGateway3Data = async (
	db: PrismaClient,
	currentData: Gateway3Answers
): Promise<CompiledGateway3Answers> => {
	const documents = await db.document.findMany({
		where: {
			caseId: currentData.caseId,
			isDeleted: false,
			documentSetId: {
				in: [...Object.values(REQUIRED_DOCUMENT_SETS), ...Object.values(OPTIONAL_DOCUMENT_SETS)]
			}
		},
		include: { latestDocumentVersion: true }
	});

	const documentsBySetId = new Map<string, typeof documents>();
	for (const document of documents) {
		const group = documentsBySetId.get(document.documentSetId) ?? [];
		group.push(document);
		documentsBySetId.set(document.documentSetId, group);
	}

	const documentsForFields = (sets: Record<string, string>) =>
		Object.fromEntries(
			Object.entries(sets).map(([field, setId]) => [
				field,
				(documentsBySetId.get(setId) ?? [])
					.map((document) => document.latestDocumentVersion?.originalFilename ?? document.name)
					.join(', ')
			])
		);

	const data = {
		...documentsForFields(REQUIRED_DOCUMENT_SETS),
		optionalData: documentsForFields(OPTIONAL_DOCUMENT_SETS)
	};

	return { ...data, ...currentData };
};

export const getMissingRequiredDocuments = (answers: CompiledGateway3Answers) =>
	(Object.keys(REQUIRED_DOCUMENT_SETS) as Array<keyof typeof REQUIRED_DOCUMENT_SETS>).filter(
		(field) => !answers[field as keyof CompiledGateway3Answers]
	);

const toDocumentId = (field: string) =>
	`document-${(DOCUMENT_LABELS[field] ?? field)
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')}`;

const toErrorText = (field: string) => {
	const label = DOCUMENT_LABELS[field] ?? field;
	return `${label.charAt(0).toLocaleUpperCase()}${label.slice(1)} document is required.`;
};

export class Gateway3TabHandler extends OverviewPageLoadHandler {
	public async handle(context: PageLoadContext): Promise<void> {
		const { req, res, next, service, journeyId, caseRecord } = context;
		if (!req.params.question && req.method == 'GET') {
			await this.tryAddPauseStatusBanner(context);
			consumeAlertsFromSession(req, res);
		}
		if (
			req.method === 'GET' &&
			String(req.params.question).startsWith('gateway-3-decision') &&
			req.originalUrl.endsWith(String(req.params.question))
		) {
			const submissionId = Number(String(req.params.question).split('-').at(-1));
			const caseReference = getParam(req.params.reference);

			const gateway3Info = await service.db.gateway3Info.findUnique({ where: { caseId: caseRecord.id } });
			if (!gateway3Info) {
				throw Error('No gateway3info data found');
			}
			const compiled = await compileGateway3Data(service.db, gateway3Info);
			const missing = getMissingRequiredDocuments(compiled);

			if (missing.length > 0) {
				req.session.gateway3DocumentErrors = missing.map((field) => ({
					text: toErrorText(field),
					href: `#${toDocumentId(field)}`
				}));
				res.redirect(
					`/case/${encodeURIComponent(caseReference)}/${COMMON_CONSTS.GATEWAY_3_JOURNEY_ID}/${encodeURIComponent(String(req.params.section))}/gateway-3-review-documents-${submissionId}`
				);
				return;
			}

			// Navigate to gw3 report subjourney
			res.redirect(
				`/case/${encodeURIComponent(caseReference)}/${encodeURIComponent(COMMON_CONSTS.GATEWAY_3_REPORT_JOURNEY_ID)}/gateway-3-submission-${submissionId}/gateway-3-decision-${submissionId}`
			);
			return;
		}
		const { db } = service;

		const journey3Data = await db.gateway3Info.findUnique({
			include: {
				submissions: true
			},
			where: { caseId: caseRecord.id }
		});
		if (!journey3Data) {
			throw Error('No gateway3info data found');
		}
		await addUploadedDocumentDetailsToAnswers(
			service,
			caseRecord,
			req,
			journey3Data,
			COMMON_CONSTS.GATEWAY_3_JOURNEY_ID
		);

		if (
			req.method === 'GET' &&
			String(req.params.question).startsWith('gateway-3-review-documents') &&
			req.session.gateway3DocumentErrors
		) {
			res.locals.errorSummary = req.session.gateway3DocumentErrors;
			delete req.session.gateway3DocumentErrors;
		}

		const journey4Data = await db.examinationInfo.findUnique({ where: { caseId: caseRecord.id } });
		const journeyResponse = new JourneyResponse(journeyId, '', journey3Data);
		journeyResponse.answers.examinationWebsite = journey4Data?.examinationWebsite;

		journeyResponse.answers = await compileGateway3Data(db, {
			...journey3Data,
			examinationWebsite: journey4Data?.examinationWebsite
		});
		res.locals.journeyResponse = journeyResponse;

		if (next) next();
	}
}
