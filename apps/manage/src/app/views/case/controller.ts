import type { AsyncRequestHandler } from '@planning-inspectorate/core/util';
import type { ManageService } from '#service';
import { type SaveDataFn, type Question } from '@planning-inspectorate/dynamic-forms';
import type { Request, Response, NextFunction } from 'express';
import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import * as authSession from '@planning-inspectorate/core/auth';
import { examinationPauseBaseUrls, questions } from './questions.ts';
import type { CaseModel } from '@pins/local-plans-database/src/client/models/Case.ts';
import { type FileUploaderSession } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import { DocumentUtil } from '@pins/local-plans-lib/util/documents.ts';
import { type FileUploaderQuestionProps } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import { fileUploadQuestionProperties } from './questions.ts';
import { CUSTOM_COMPONENTS, CUSTOM_COMPONENT_CLASSES } from '../layouts/index.ts';
import { getSubmissionCheckForQuestion } from './submission-check/submission-check-factory.ts';
import type { OverviewPageLoadHandler } from './overview-data-handlers/overview-page-load-handler.ts';
import { asyncHandler } from '@planning-inspectorate/core/util';
import multer from 'multer';
import { resolveCaseHeaderStatus } from '../../classes/status-tag-classes.ts';
import { gateway2SetIds, gateway3SetIds } from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';
import { getExaminationStages, sortGateway3Submissions } from '#util/util.ts';
import { journeyQuestions } from './journey.ts';
import { COMMON_CONSTS } from '../../classes/common-consts.ts';
import { OverviewSaveController } from './save/overview-save-controller.ts';
import { Gateway1SaveController } from './save/gateway-1-save-controller.ts';
import { Gateway2SaveController } from './save/gateway-2-save-controller.ts';
import { Gateway3SaveController, saveGateway3Submissions } from './save/gateway-3-save-controller.ts';
import { ExaminationSaveController } from './save/examination-save-controller.ts';
import { formatDateToString } from '../../util/date.ts';
import type { FileUploaderControllerOptions } from '@pins/local-plans-lib/forms/custom-components/file-uploader/upload-controller.ts';
import { resolveSessionKey } from '@pins/local-plans-lib/forms/custom-components/file-uploader/upload-controller.ts';
import {
	EXAMINATION_STATUS_ID,
	GATEWAY_3_DECISION_ID
} from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';
import { checkSoundUnsoundManuallySet } from '../../util/util.ts';
import { pushAlertToSession } from '../../util/alert.ts';
import { EXAMINING_INSPECTOR_FIELDS } from '../../classes/case-field-mappings.ts';

type ManageListAction = 'edit' | 'remove' | undefined;

/** the name of the contacts section. */
const CONTACTS_SECTION = 'contacts';

// Generate a map of <fieldName: field title>
const caseHistoryLabels = {
	// Expand regular questyions
	...(Object.fromEntries(Object.values(questions).map((value) => [value.fieldName, value.title])) as Record<
		string,
		string
	>),
	// Expand inputFields from CUSTOM_MULTI_FIELD_INPUT questions
	...(Object.fromEntries(
		Object.values(questions)
			.filter((value) => value instanceof CUSTOM_COMPONENT_CLASSES[CUSTOM_COMPONENTS.CUSTOM_MULTI_FIELD_INPUT])
			.flatMap((entry) => entry.inputFields)
			.map((inputField) => [inputField.fieldName, inputField.title])
	) as Record<string, string>)
};

type FileUploadSession = Request['session'] &
	FileUploaderSession & {
		editingFromCheckAnswers?: boolean;
		forms?: Record<string, unknown>;
	};

export type UploadDocumentRequest = Request & {
	currentCase?: CaseModel;
	session: FileUploadSession;
};

// The file upload routes are shared by all of the document questions.
// Keep the question configs in a couple of route-friendly shapes so the URL in
// `:question` decides which field, validation rules and document set are used.
export type FileUploadQuestion = FileUploaderQuestionProps & {
	fieldName: string;
	url: string;
};

// Ordered list for loading each persisted upload when the case page opens.
export const fileUploadQuestionConfigs = Object.values(fileUploadQuestionProperties) as FileUploadQuestion[];
// URL list for the file uploader middleware to recognise upload pages.
export const fileUploadQuestionUrls = fileUploadQuestionConfigs.map((questionConfig) => questionConfig.url);
// Fast lookup for POST routes such as `/local-plan-timetable/upload-documents`.
export const fileUploadQuestionsByUrl = new Map(
	fileUploadQuestionConfigs.map((questionConfig) => [questionConfig.url, questionConfig])
);
export const journeyFileUploadQuestionConfigs = Object.fromEntries(
	Object.entries(journeyQuestions).map(([k, v]) => [
		k,
		Array.from(v, (elem) => fileUploadQuestionProperties[elem] as FileUploadQuestion).filter((elem) => Boolean(elem))
	])
);

/** * Returns a handler that applies a single case-overview edit to the database. * The action (edit / remove / update) is derived from the route params. */
export function updateCaseField(service: ManageService): SaveDataFn {
	return async ({ req, res, data }: { req: Request; res: Response; data: Record<string, any> }): Promise<void> => {
		const { db, logger } = service;

		const reference = getParam(req.params.reference);
		const section = getParam(req.params.section);
		const action = req.params.manageListAction as ManageListAction;
		const currentItemId = getParam(req.params.manageListItemId);

		if (action === 'remove') {
			await removeItem({ db, reference, section, currentItemId });
			return;
		}

		let writeResponse: { dataWritten: boolean; writtenToDB: boolean };
		const firstSegmentUrl = getFirstSegmentOfUrl(req.url);
		switch (firstSegmentUrl) {
			case COMMON_CONSTS.OVERVIEW: {
				writeResponse = await new OverviewSaveController(
					service,
					req,
					reference,
					section,
					action,
					currentItemId
				).prepareAndSave(data.answers);
				break;
			}
			case COMMON_CONSTS.GATEWAY_1_JOURNEY_ID: {
				writeResponse = await new Gateway1SaveController(service, req, reference).prepareAndSave(data.answers);
				break;
			}
			case COMMON_CONSTS.GATEWAY_2_JOURNEY_ID: {
				writeResponse = await new Gateway2SaveController(service, req, reference).prepareAndSave(data.answers);
				break;
			}
			case COMMON_CONSTS.GATEWAY_3_JOURNEY_ID: {
				writeResponse = await new Gateway3SaveController(service, req, reference).prepareAndSave(data.answers);
				break;
			}
			case COMMON_CONSTS.EXAMINATION_JOURNEY_ID: {
				writeResponse = await new ExaminationSaveController(service, req, reference).prepareAndSave(data.answers);
				break;
			}
			case COMMON_CONSTS.EXAMINATION_PAUSE_JOURNEY_ID: {
				writeResponse = await new ExaminationSaveController(service, req, reference).prepareAndSave(data.answers);
				// Tech debt: Would be good to simplify how case history is written - embedding within the save controller
				// is ideal but will be tricky without tight coupling. For now this quick and dirty if-statement will do
				if (writeResponse.writtenToDB) {
					const question = String(req.params.question);
					const matchedExaminationPauseQuestion = examinationPauseBaseUrls.find((prefix) =>
						question.startsWith(prefix)
					);
					if (matchedExaminationPauseQuestion) {
						pushAlertToSession(req, 'success', 'Changes saved');
						const isExaminationRestartQuestion =
							question.startsWith('examination-pause-end-date') ||
							question.startsWith('examination-pause-restart-details');
						const caseHistoryMessage = isExaminationRestartQuestion ? 'Plan restarted' : 'Plan paused';
						const account = authSession.getAccount(req.session);
						const currentUser = account?.name ?? 'Unknown';
						await updateCaseHistory(service, req, db, { examinationPause: null }, {}, reference, currentUser, {
							examinationPause: caseHistoryMessage
						});
						return;
					}
				}
				break;
			}
			default: {
				logger.info(`url - ${req.url} not found`);
				return res.status(404).render('views/errors/404.njk');
			}
		}
		if (writeResponse.dataWritten && writeResponse.writtenToDB) {
			const columns = Object.keys(data.answers);
			const oldValues = Object.fromEntries(columns.map((key) => [key, res.locals.journeyResponse?.answers[key]]));

			const account = authSession.getAccount(req.session);
			const currentUser = account?.name ?? 'Unknown';

			await updateCaseHistory(service, req, db, oldValues, data.answers, reference, currentUser);
		}
	};
}

async function resolveCaseIdFromReference(db: PrismaClient, reference: string): Promise<string> {
	const caseRecord = await db.case.findUnique({
		where: { reference },
		select: { id: true }
	});

	if (!caseRecord) {
		throw new Error(`Case not found for reference "${reference}"`);
	}

	return caseRecord.id;
}

/** Removes a contact, or disconnects an LPA from the case. */
async function removeItem({
	db,
	reference,
	section,
	currentItemId
}: {
	db: ManageService['db'];
	reference: string;
	section: string;
	currentItemId: string;
}): Promise<void> {
	if (section === CONTACTS_SECTION) {
		await db.contact.delete({ where: { id: currentItemId } });
		return;
	}
	await db.case.update({
		where: { reference },
		data: { lpas: { disconnect: { lpaCode: currentItemId } } }
	});
}

/** Normalises a route param that may be a string, string array, or undefined. */
export function getParam(value: string | string[] | undefined): string {
	if (Array.isArray(value)) return value[0] ?? '';
	return value ?? '';
}

/** * Trims every string value on the form input. * Returns a new object rather than mutating the request body. */
export function trimStringValues<T extends object>(input: T): T {
	const trimmed = {} as T;
	for (const key in input) {
		const value = input[key];
		trimmed[key] = (typeof value === 'string' ? value.trim() : value) as T[typeof key];
	}
	return trimmed;
}

export function buildGetJourneyMiddleware(
	service: ManageService,
	journeyId: string,
	pageLoadHandler: new () => OverviewPageLoadHandler
): AsyncRequestHandler {
	return async (req, res, next) => {
		const { db } = service;
		const reference = getParam(req.params.reference);

		const caseRecord = await db.case.findUnique({
			where: { reference },
			select: { id: true, planTitle: true }
		});

		if (!caseRecord) return res.status(404).render('views/errors/404.njk');

		res.locals.planTitle = caseRecord.planTitle;
		res.locals.reference = reference;

		const journey1Data = await db.gateway1Info.findUnique({ where: { caseId: caseRecord.id } });
		const journey2Data = await db.gateway2Info.findUnique({
			where: { caseId: caseRecord.id },
			include: { workshops: true }
		});
		const journey3Data = await db.gateway3Info.findUnique({
			where: { caseId: caseRecord.id },
			include: { submissions: true }
		});

		const gateway2Documents = await db.document.findMany({
			where: {
				caseId: caseRecord.id,
				documentSetId: { in: gateway2SetIds }
			}
		});

		const gateway3Documents = await db.document.findMany({
			where: {
				caseId: caseRecord.id,
				documentSetId: { in: gateway3SetIds }
			}
		});

		const examinationStatus = await getExaminationStages(service, caseRecord.id);

		const headerStatus = resolveCaseHeaderStatus(
			gateway2Documents,
			gateway3Documents,
			journey1Data,
			journey2Data,
			journey3Data?.submissions ?? [],
			examinationStatus
		);
		res.locals.headerStatusText = headerStatus.headerStatusText;
		res.locals.headerStatusClasses = headerStatus.headerStatusClasses;

		const handler = new pageLoadHandler();
		await handler.handle({ req, res, next, service, journeyId, reference, caseRecord });
	};
}

export function buildCheckReportMiddleware(service: ManageService, journeyId: string): AsyncRequestHandler {
	return async (req, res) => {
		const section = getParam(req.params.section);
		const questionUrl = getParam(req.params.question);
		const caseReference = getParam(req.params.reference);
		const caseId = await resolveCaseIdFromReference(service.db, caseReference);
		const questionConfig = fileUploadQuestionConfigs.find((question) => question.url == questionUrl);
		if (!questionConfig) {
			throw new Error(`Could not find question config for question url '${questionUrl}'`);
		}
		const submissionCheck = new (getSubmissionCheckForQuestion(questionUrl))();
		const submissionCheckData = await submissionCheck.generateDataForPage(
			caseId,
			caseReference,
			journeyId,
			section,
			questionUrl,
			req.originalUrl,
			service,
			req.session.fileUploader?.[fileUploaderCaseSessionKeyForField(req, questionConfig.fieldName)]?.uploadedFiles ?? []
		);
		res.render('views/layouts/submit-documents-check-your-answers', submissionCheckData);
		return;
	};
}

export function buildRemoveDocumentConfirmMiddleware(journeyId: string): AsyncRequestHandler {
	return async (req, res) => {
		const section = getParam(req.params.section);
		const questionUrl = getParam(req.params.question);
		const fileId = getParam(req.params.fileId);
		const caseReference = getParam(req.params.reference);
		const questionConfig = fileUploadQuestionConfigs.find((question) => question.url == questionUrl);
		const file = questionConfig
			? req.session.fileUploader?.[
					fileUploaderCaseSessionKeyForField(req, questionConfig.fieldName)
				]?.uploadedFiles?.find((uploadedFile: { id: string }) => uploadedFile.id === fileId)
			: undefined;
		if (!questionConfig || !file) {
			return res.status(404).render('views/errors/404.njk');
		}
		const journeyUrl = `/case/${encodeURIComponent(caseReference)}/${encodeURIComponent(journeyId)}`;
		res.render('views/layouts/remove-uploaded-document', {
			caseReference,
			fileName: file.fileName,
			formAction: `${journeyUrl}/${encodeURIComponent(section)}/${encodeURIComponent(questionUrl)}/delete-document/${encodeURIComponent(fileId)}`,
			backLink: `${journeyUrl}/${encodeURIComponent(section)}/${COMMON_CONSTS.EXAMINATION_REPORT_MANAGE_QUESTION}`
		});
	};
}

/** Adds the case section navigation to locals for the case routes. */
export function addCaseNavigation(): AsyncRequestHandler {
	return async (req, res, next) => {
		const reference = getParam(req.params.reference);
		res.locals.navigation = createNavigationParameters(req.url, reference);
		if (next) next();
	};
}

function createNavigationParameters(path: string, reference: string, currentSection?: string) {
	const baseUrl = `/case/${encodeURIComponent(reference)}`; //replace?
	const items = [
		{ text: 'Overview', href: `${baseUrl}/${COMMON_CONSTS.OVERVIEW}` },
		{ text: 'Timetable', href: '#' },
		{ text: 'Gateway 1', href: `${baseUrl}/${COMMON_CONSTS.GATEWAY_1_JOURNEY_ID}` },
		{ text: 'Gateway 2', href: `${baseUrl}/${COMMON_CONSTS.GATEWAY_2_JOURNEY_ID}` },
		{ text: 'Gateway 3', href: `${baseUrl}/${COMMON_CONSTS.GATEWAY_3_JOURNEY_ID}` },
		{ text: 'Examination', href: `${baseUrl}/${COMMON_CONSTS.EXAMINATION_JOURNEY_ID}` },
		{
			text: 'Case History',
			href: `${baseUrl}/overview?section=case-history`,
			active: currentSection === 'case-history'
		}
	];

	const pathWithoutQuery = path.split('?')[0];

	return items.map((item) => ({
		...item,
		active:
			item.active ?? (currentSection !== 'case-history' && item.href !== '#' && item.href.includes(pathWithoutQuery))
	}));
}

function getFirstSegmentOfUrl(url: string): string {
	const path = url.split('?')[0];
	return path.split('/').filter(Boolean)[0] ?? '';
}

export async function updateCaseHistory(
	service: ManageService,
	req: Request,
	db: Pick<PrismaClient, 'case'>,
	previousValues: Record<string, any>,
	newValues: Record<string, any>,
	reference: string,
	currentUser: string,
	overrideLabels: Record<string, string> = {}
) {
	await db.case.update({
		where: { reference },
		data: {
			caseHistories: {
				create: await Promise.all(
					Object.entries(previousValues).map(async ([key, oldValue]) => ({
						event: await formatCaseHistoryEvent(service, req, key, oldValue, newValues[key], overrideLabels[key]),
						username: currentUser
					}))
				)
			}
		}
	});
}

type ExaminationStatusDatabase = Pick<PrismaClient, 'examinationInfo'>;

const examinationAvailableStatuses = new Set<string>([
	EXAMINATION_STATUS_ID.READY_TO_START,
	EXAMINATION_STATUS_ID.IN_PROGRESS,
	EXAMINATION_STATUS_ID.SUBMITTED,
	EXAMINATION_STATUS_ID.IN_EXAMINATION,
	EXAMINATION_STATUS_ID.PAUSED,
	EXAMINATION_STATUS_ID.REPORT_ISSUED,
	EXAMINATION_STATUS_ID.PLAN_ADOPTED
]);

async function ensureExaminationIsReady(db: ExaminationStatusDatabase, caseId: string) {
	const result = await db.examinationInfo.updateMany({
		where: {
			caseId,
			status: EXAMINATION_STATUS_ID.CANNOT_START_YET
		},
		data: {
			status: EXAMINATION_STATUS_ID.READY_TO_START
		}
	});
	if (result.count === 1) {
		return true;
	}
	if (result.count !== 0) {
		throw Error(`Expected to update one examination record for case '${caseId}', but updated ${result.count}`);
	}
	const examinationInfo = await db.examinationInfo.findUnique({
		where: { caseId },
		select: { status: true }
	});
	if (!examinationInfo) {
		throw Error(`Could not find examination information for case '${caseId}'`);
	}
	if (!examinationAvailableStatuses.has(examinationInfo.status)) {
		throw Error(`Could not make examination available for case '${caseId}'`);
	}
	return false;
}

async function formatCaseHistoryEvent(
	service: ManageService,
	req: Request,
	key: string,
	oldValue: unknown,
	newValue: unknown,
	overrideLabel: string | undefined
) {
	if (overrideLabel) {
		return overrideLabel;
	}
	const label = key in caseHistoryLabels ? caseHistoryLabels[key] : key;
	let oldValueText = 'updated to';
	if (oldValue != null && oldValue != '') {
		oldValueText = `updated from ${await formatCaseHistoryValue(service, req, key, oldValue)} to`;
	}
	return `${label} ${oldValueText} ${await formatCaseHistoryValue(service, req, key, newValue)}`;
}

async function formatCaseHistoryValue(service: ManageService, req: Request, question: string, value: unknown) {
	if (value instanceof Date) {
		return new Intl.DateTimeFormat('en-GB', {
			day: 'numeric',
			month: 'long',
			timeZone: 'Europe/London',
			year: 'numeric'
		}).format(value);
	}

	if (question == 'isSound') {
		const planOutcomeLabels: Record<string, string> = {
			sound: 'Sound',
			'sound-with-modifications': 'Sound with modifications',
			unsound: 'Unsound'
		};
		return typeof value === 'string' ? (planOutcomeLabels[value] ?? value) : value;
	}

	if (typeof value === 'boolean') {
		return value;
	}
	const entraUserQuestions = new Set(['caseOfficer', ...EXAMINING_INSPECTOR_FIELDS]);
	if (entraUserQuestions.has(question)) {
		const entraClient = service.getEntraClient(req.session as authSession.SessionWithAuth);
		if (entraClient) {
			const fetchedDisplayName = await entraClient.getUserDisplayName(String(value));
			if (fetchedDisplayName) {
				return fetchedDisplayName;
			}
		}
	}

	return `${value ?? ''}`;
}

export function getDeleteCase(service: ManageService): AsyncRequestHandler {
	return async (req, res) => {
		const reference = getParam(req.params.reference);
		const currentCase = await service.db.case.findUnique({
			where: { reference },
			include: { lpas: true }
		});

		if (!currentCase) {
			return res.status(404).render('views/errors/404.njk');
		}

		res.locals.baseUrl = `/case/${encodeURIComponent(reference)}`;

		const rows = [
			[{ text: 'Case reference' }, { text: currentCase.reference }],
			[{ text: 'Plan title' }, { text: currentCase.planTitle }],
			[{ text: 'Plan type' }, { text: getOptionText('planType', currentCase.planType) }],
			[{ text: 'LPA' }, { text: currentCase.lpas.map((lpa) => getOptionText('lpa', lpa.lpaCode)).join(', ') }],
			[{ text: 'Case officer' }, { text: getOptionText('caseOfficer', currentCase.caseOfficer) }]
		];

		res.render('views/layouts/delete-case.njk', {
			rows
		});
	};
}

export function getDeleteWorkshop(): AsyncRequestHandler {
	return async (req, res) => {
		const reference = getParam(req.params.reference);
		const workshopToDelete = parseInt(String(req.url.split('-').at(-1)));
		if (isNaN(workshopToDelete)) {
			throw Error('Could not extract the workshop number from the url');
		}
		res.locals.baseUrl = `/case/${encodeURIComponent(reference)}/gateway-2`;
		res.render('views/layouts/delete-workshop.njk', { reference: reference, workshopIndex: workshopToDelete });
	};
}

/**
 * For deleting a workshop
 * @param service
 * @returns Redirects back to the GW2 tab
 */
export function postDeleteWorkshop(service: ManageService): AsyncRequestHandler {
	return async (req, res) => {
		const reference = getParam(req.params.reference);
		const workshopToDelete = parseInt(String(req.url.split('-').at(-1)));
		if (isNaN(workshopToDelete)) {
			throw Error('Could not extract the workshop number from the url');
		}
		const returnUrl = `/case/${encodeURIComponent(reference)}/gateway-2`;
		new Gateway2SaveController(service, req, reference).deleteWorkshop(workshopToDelete);
		const account = authSession.getAccount(req.session);
		const currentUser = account?.name ?? 'Unknown';
		await updateCaseHistory(
			service,
			req,
			service.db,
			{
				workshops: null // Will be overridden by overrideLabels
			},
			{},
			reference,
			currentUser,
			{
				workshops: 'Workshop cancelled'
			}
		);
		return res.redirect(returnUrl);
	};
}

export function postMarkAsDeleteCase(service: ManageService): AsyncRequestHandler {
	return async (req, res) => {
		const reference = getParam(req.params.reference);
		const currentCase = await service.db.case.findUnique({
			where: { reference }
		});

		if (!currentCase) {
			return res.status(404).render('views/errors/404.njk');
		}

		await markAsDeleteCase({
			db: service.db,
			id: currentCase.id
		});

		return res.redirect('/');
	};
}

async function markAsDeleteCase({ db, id }: { db: ManageService['db']; id: string }): Promise<void> {
	await db.case.update({ where: { id: id }, data: { deletedDate: new Date() } });
	return;
}

function getOptionText(question: 'planType' | 'lpa' | 'caseOfficer', value: string | null) {
	const option = questions[question].options?.find(
		({ value: optionValue }: { value: string }) => optionValue === value
	);

	return option?.text ?? `${value ?? ''}`;
}

/**
 * Return the url for the question
 * @param req The request that holds the question
 * @returns The first question if the question is an array, just the question itself if it is a string, or undefined if not found
 */
export function getRouteQuestionUrl(req: Request): string | undefined {
	const questionUrl = Array.isArray(req.params.question) ? req.params.question[0] : req.params.question;
	return questionUrl || undefined;
}

/**
 * Load the question details for the given question
 * @param req The request that holds the question
 * @returns The config for the question as defined in questions.ts
 */
export function getRouteFileUploadQuestion(req: Request): FileUploadQuestion {
	const questionUrl = getRouteQuestionUrl(req);
	const questionConfig = questionUrl ? fileUploadQuestionsByUrl.get(questionUrl) : undefined;
	if (!questionConfig) {
		throw new Error(`No Gateway 2 file upload question configured for "${questionUrl ?? ''}"`);
	}

	return questionConfig;
}

/**
 * Retrieves the case reference from the params and creates the file upload session key.
 * Example format: LP-TEST-001:gateway2CoverLetter.
 * @param req The request that holds the question
 * @returns A URL segment of the form `planReference:fieldName`
 */
//
// Example format: LP-TEST-001:gateway2CoverLetter.
export function fileUploaderCaseSessionKey(req: Request) {
	const questionConfig = getRouteFileUploadQuestion(req);
	return fileUploaderCaseSessionKeyForField(req, questionConfig.fieldName);
}

/**
 * Return a URL segment for the given request and fieldName
 * @param req The request object which holds the session details
 * @param fieldName The field to generate the URL segment for
 * @returns A string of the form `planReference:fieldName`
 */
export function fileUploaderCaseSessionKeyForField(req: Request, fieldName: string) {
	return `${getParam(req.params.reference)}:${fieldName}`;
}

export function downloadDocument(service: ManageService): AsyncRequestHandler {
	return async (req, res) => {
		const documentId = getParam(req.params.documentId);
		if (!documentId) {
			throw Error(`Missing a documentId from the download-case-document endpoint`);
		}
		// Todo add error handling for if the file is not found
		await DocumentUtil.downloadDocumentToResponse(service, documentId, res);
	};
}

export function issueGateway2Report(service: ManageService, journeyId: string): AsyncRequestHandler {
	return async (req, res) => {
		const caseReference = getParam(req.params.reference);
		const caseId = await resolveCaseIdFromReference(service.db, caseReference);
		const existingGatewayDetails = await service.db.gateway2Info.findUnique({
			select: {
				reportIssuedDate: true
			},
			where: {
				caseId: caseId
			}
		});
		if (!existingGatewayDetails?.reportIssuedDate) {
			// Try to update the reportIssuedDate
			const reportIssuedDate = new Date();
			const account = authSession.getAccount(req.session);
			const currentUser = account?.name ?? 'Unknown';
			//reqCopy.params.question = COMMON_CONSTS.GATEWAY_2_REPORT_ISSUED_DATE_QUESTION;
			await new Gateway2SaveController(service, req, caseReference).prepareAndSave({
				reportIssuedDate: reportIssuedDate
			});
			await updateCaseHistory(
				service,
				req,
				service.db,
				{
					gateway2Report: null // Will be overridden by overrideLabels
				},
				{},
				caseReference,
				currentUser,
				{
					gateway2Report: `Gateway 2 report issued on ${await formatCaseHistoryValue(service, req, '', reportIssuedDate)}`
				}
			);
			// Alert message is saved as a session variable and inserted into the view by buildGetJourneyMiddleware
			pushAlertToSession(req, 'success', 'Gateway 2 report issued');
		} else {
			// Alert message is saved as a session variable and inserted into the view by buildGetJourneyMiddleware
			pushAlertToSession(req, 'important', 'Gateway 2 report already issued');
		}
		res.redirect(`/case/${encodeURIComponent(caseReference)}/${encodeURIComponent(journeyId)}`);
		return;
	};
}

export function issueExaminationReport(service: ManageService, journeyId: string): AsyncRequestHandler {
	return async (req, res) => {
		const caseReference = getParam(req.params.reference);
		const caseId = await resolveCaseIdFromReference(service.db, caseReference);
		const account = authSession.getAccount(req.session);
		const currentUser = account?.name ?? 'Unknown';

		const existingExaminationDetails = await service.db.examinationInfo.findUnique({
			select: { soundUnsoundDate: true },
			where: { caseId }
		});
		const returnToManage = req.session.examinationReportReturnToManage === true;
		delete req.session.examinationReportReturnToManage;
		if (existingExaminationDetails?.soundUnsoundDate && (req.query.returnTo !== 'check' || returnToManage)) {
			const manuallySetInFirstSubmission = await checkSoundUnsoundManuallySet(service, caseId);
			const reportIssuedDate = manuallySetInFirstSubmission ? existingExaminationDetails.soundUnsoundDate : new Date();
			if (!manuallySetInFirstSubmission) {
				await new ExaminationSaveController(service, req, caseReference).prepareAndSave({
					soundUnsoundDate: reportIssuedDate
				});
			}
			await updateCaseHistory(service, req, service.db, { examinationReport: null }, {}, caseReference, currentUser, {
				examinationReport: `Examination report document added; report issued on ${await formatCaseHistoryValue(service, req, '', reportIssuedDate)}`
			});
			pushAlertToSession(req, 'success', 'Document added and notification sent');

			// Go back to Manage docs page after document addition
			res.redirect(
				`/case/${encodeURIComponent(caseReference)}/${encodeURIComponent(journeyId)}/outcome/${questions.examinationReportManage.url}`
			);
			return;
		}

		const reportIssuedDate = existingExaminationDetails?.soundUnsoundDate ?? new Date();
		if (!existingExaminationDetails?.soundUnsoundDate) {
			await new ExaminationSaveController(service, req, caseReference).prepareAndSave({
				soundUnsoundDate: reportIssuedDate
			});
		}
		await updateCaseHistory(
			service,
			req,
			service.db,
			{
				examinationReport: null // Will be overridden by overrideLabels
			},
			{},
			caseReference,
			currentUser,
			{
				examinationReport: `Examination report issued on ${await formatCaseHistoryValue(service, req, '', reportIssuedDate)}`
			}
		);
		pushAlertToSession(req, 'success', 'Final report and supporting documents saved and notification sent');

		// After first time exam doc upload, go back to examination tab
		res.redirect(`/case/${encodeURIComponent(caseReference)}/${encodeURIComponent(journeyId)}`);
		return;
	};
}

export function issueGateway2WorkshopDocuments(service: ManageService, journeyId: string): AsyncRequestHandler {
	return async (req, res) => {
		const caseReference = getParam(req.params.reference);
		const caseId = await resolveCaseIdFromReference(service.db, caseReference);
		const existingGatewayDetails = await service.db.gateway2Info.findUnique({
			select: {
				workshopDocumentUploadedDate: true
			},
			where: {
				caseId: caseId
			}
		});
		if (!existingGatewayDetails?.workshopDocumentUploadedDate) {
			// Try to update the reportIssuedDate
			const workshopDocumentUploadedDate = new Date();
			const account = authSession.getAccount(req.session);
			const currentUser = account?.name ?? 'Unknown';
			//reqCopy.params.question = 'workshop-document-uploaded-date'
			await new Gateway2SaveController(service, req, caseReference).prepareAndSave({
				workshopDocumentUploadedDate: workshopDocumentUploadedDate
			});
			await updateCaseHistory(
				service,
				req,
				service.db,
				{
					gateway2WorkshopDocuments: null // Will be overridden by overrideLabels
				},
				{},
				caseReference,
				currentUser,
				{
					gateway2WorkshopDocuments: `Gateway 2 workshop documents uploaded on ${await formatCaseHistoryValue(service, req, '', workshopDocumentUploadedDate)}`
				}
			);
			// Alert message is saved as a session variable and inserted into the view by buildGetJourneyMiddleware
			pushAlertToSession(req, 'success', 'Workshop document(s) uploaded');
		} else {
			// Alert message is saved as a session variable and inserted into the view by buildGetJourneyMiddleware
			pushAlertToSession(req, 'important', 'Gateway 2 workshopDocuments already issued');
		}
		res.redirect(`/case/${encodeURIComponent(caseReference)}/${journeyId}`);
		return;
	};
}

export function issueGateway1SLA(service: ManageService, journeyId: string): AsyncRequestHandler {
	return async (req, res) => {
		const caseReference = getParam(req.params.reference);
		const caseId = await resolveCaseIdFromReference(service.db, caseReference);
		const existingGatewayDetails = await service.db.gateway1Info.findUnique({
			select: {
				slaSentDate: true
			},
			where: {
				caseId: caseId
			}
		});
		if (!existingGatewayDetails?.slaSentDate) {
			// Try to update the slaSentDate
			const slaSentDate = new Date();
			const account = authSession.getAccount(req.session);
			const currentUser = account?.name ?? 'Unknown';
			//reqCopy.params.question = 'sla-sent-date';
			await new Gateway1SaveController(service, req, caseReference).prepareAndSave({
				slaSentDate: slaSentDate
			});
			await updateCaseHistory(
				service,
				req,
				service.db,
				{
					signedSla: null // Will be overridden by overrideLabels
				},
				{},
				caseReference,
				currentUser,
				{
					signedSla: `Signed SLA uploaded on ${await formatCaseHistoryValue(service, req, '', slaSentDate)}`
				}
			);
			// Alert message is saved as a session variable and inserted into the view by buildGetJourneyMiddleware
			pushAlertToSession(req, 'success', 'Signed SLA uploaded. LPA can proceed to Gateway 2 submission');
		} else {
			// Alert message is saved as a session variable and inserted into the view by buildGetJourneyMiddleware
			pushAlertToSession(req, 'important', 'SLA already issued');
		}
		res.redirect(`/case/${encodeURIComponent(caseReference)}/${encodeURIComponent(journeyId)}`);
		return;
	};
}

export function issueGateway3Document(service: ManageService): AsyncRequestHandler {
	return async (req, res) => {
		const caseReference = getParam(req.params.reference);
		const caseId = await resolveCaseIdFromReference(service.db, caseReference);
		const gateway3Info = await service.db.gateway3Info.findUnique({
			select: {
				submissions: true
				//completionDate: true
			},
			where: {
				caseId: caseId
			}
		});
		if (!gateway3Info) {
			throw Error('No gateway3info data could be found');
		}
		const existingSubmissions = sortGateway3Submissions(gateway3Info.submissions);
		const submissionId = Number(String(req.params.question).replace('gateway-3-document-', ''));
		const submission = existingSubmissions.at(submissionId - 1);
		if (!submission) {
			throw Error('Could not find a submission');
		}
		if (!submission?.completionDate) {
			const completionDate = new Date();
			submission.completionDate = completionDate;
			if (submission.decision === GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED) {
				// If a submission was rejected by the inspector, then add a new gw3 submission details block
				existingSubmissions.push({
					id: crypto.randomUUID(),
					decision: null,
					completionDate: null,
					gateway3InfoId: submission.gateway3InfoId
				});
			}
			const account = authSession.getAccount(req.session);
			const currentUser = account?.name ?? 'Unknown';
			const caseHistoryLabel = `Gateway 3 decision issued on ${await formatCaseHistoryValue(service, req, '', completionDate)}`;
			await service.db.$transaction(async (transaction) => {
				await saveGateway3Submissions(transaction, caseId, existingSubmissions);
				if (submission.decision === GATEWAY_3_DECISION_ID.PROCEED_TO_EXAMINATION) {
					await ensureExaminationIsReady(transaction, caseId);
				}
				await updateCaseHistory(
					service,
					req,
					transaction,
					{
						gateway3Documents: null // Will be overridden by overrideLabels
					},
					{},
					caseReference,
					currentUser,
					{
						gateway3Documents: caseHistoryLabel
					}
				);
			});
			// Alert message is saved as a session variable and inserted into the view by buildGetJourneyMiddleware
			pushAlertToSession(req, 'success', 'Gateway 3 decision issued');
		} else {
			const examinationStatusUpdated =
				submission.decision === GATEWAY_3_DECISION_ID.PROCEED_TO_EXAMINATION
					? await service.db.$transaction((transaction) => ensureExaminationIsReady(transaction, caseId))
					: false;
			if (examinationStatusUpdated) {
				pushAlertToSession(req, 'success', 'Gateway 3 decision already issued. Examination is ready to start');
			} else {
				// Alert message is saved as a session variable and inserted into the view by buildGetJourneyMiddleware
				pushAlertToSession(req, 'important', 'Gateway 3 decision already issued');
			}
		}
		res.redirect(
			`/case/${encodeURIComponent(caseReference)}/${encodeURIComponent(COMMON_CONSTS.GATEWAY_3_JOURNEY_ID)}`
		);
		return;
	};
}

// Builds the URL for the current file upload question.
export function redirectToFileUploaderQuestion(req: Request) {
	const planPath = req.params.planReference ? `/${req.params.planReference}` : '';
	// Any questions that need to route to new subjourneys can be defined here
	if (req.params.question === COMMON_CONSTS.GATEWAY_2_REPORT_QUESTION) {
		return `${req.baseUrl}${planPath}/${COMMON_CONSTS.GATEWAY_2_JOURNEY_ID}/${req.params.section}/${req.params.question}`;
	}
	if (req.params.question === COMMON_CONSTS.SIGNED_SLA_QUESTION) {
		return `${req.baseUrl}${planPath}/${COMMON_CONSTS.GATEWAY_1_JOURNEY_ID}/${req.params.section}/${req.params.question}`;
	}
	if (req.params.question == COMMON_CONSTS.GATEWAY_2_WORKSHOP_DOCUMENTS_QUESTION) {
		return `${req.baseUrl}${planPath}/${COMMON_CONSTS.GATEWAY_2_JOURNEY_ID}/${req.params.section}/${req.params.question}`;
	}
	const journey = req.url.split(String(req.params.section))[0];
	if (
		req.params.question === COMMON_CONSTS.EXAMINATION_REPORT_QUESTION &&
		req.params.fileId &&
		req.body?.returnToManage === 'true'
	) {
		return `${req.baseUrl}${planPath}${journey}${req.params.section}/${COMMON_CONSTS.EXAMINATION_REPORT_MANAGE_QUESTION}`;
	}
	if (req.params.question === COMMON_CONSTS.EXAMINATION_REPORT_QUESTION && req.query?.returnTo === 'check') {
		return `${req.baseUrl}${planPath}${journey}${req.params.section}/${req.params.question}?returnTo=check`;
	}
	return `${req.baseUrl}${planPath}${journey}${req.params.section}/${req.params.question}`;
}

/**
 * Constructs a redirect URL for a case based on the provided request parameters and session data.
 *
 * @param {Request} req - The HTTP request object containing parameters, URL, and session data.
 * @param {string} path - The base path to append to the generated URL.
 * @param options
 * @returns {string} The constructed redirect URL.
 */
export const redirectToChecks = (req: Request, path: string, options?: FileUploaderControllerOptions): string => {
	const plan = req.params.reference;
	const questionUrl = `/case/${plan}/${path}/${req.params.section}/${req.params.question}`;
	const queryString = req.query?.returnTo === 'check' ? '?returnTo=check' : '';
	if (!options) return `${questionUrl}${queryString}`;
	const urlPathRoot = req.url.split('/')[1];
	const session = req.session;
	const sessionKey = resolveSessionKey(req, options);
	const formFiles = session?.forms?.[urlPathRoot]
		? session?.forms?.[urlPathRoot]
		: (session.fileUploader?.[sessionKey]?.uploadedFiles ?? undefined);

	if (Object.keys(formFiles).length === 0) {
		return `${questionUrl}${queryString}`;
	}

	return `${questionUrl}/check${queryString}`;
};

export function handleMulterFileSizeError(err: Error, req: Request, res: Response, next: NextFunction) {
	if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
		const questionUrl = getRouteQuestionUrl(req);
		const questionConfig = questionUrl ? fileUploadQuestionsByUrl.get(questionUrl) : undefined;
		const sizeLabel = questionConfig?.maxFileSizeLabel ?? '250MB';
		const session = req.session as unknown as {
			errors?: Record<string, { msg: string }>;
			errorSummary?: Array<{ text: string; href: string }>;
		};
		const message =
			questionConfig?.validationMessages?.fileTooLarge ?? `The selected file must be smaller than ${sizeLabel}`;
		session.errors = { 'upload-form': { msg: message } };
		session.errorSummary = [
			{
				text: message,
				href: '#upload-form'
			}
		];
		return res.redirect(redirectToFileUploaderQuestion(req));
	}
	return next(err);
}

/**
 * Alter the properties of specific questions before they are rendered. This is useful for properties whose value is derived
 * from a condition
 * @param service The manage service
 * @param journeyId The journey
 * @param questions The questions from question.ts
 * @returns An async handler for a router
 */
export function preprocessQuestionProperties(
	service: ManageService,
	journeyId: string,
	questions: Record<string, Question>
) {
	return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
		const reference = getParam(req.params.reference);
		if (journeyId == COMMON_CONSTS.OVERVIEW_JOURNEY_ID) {
			if (req.method == 'POST' && String(req.url).includes('case-details/case-notes')) {
				req.params.question = 'case-notes';
				req.params.section = 'case-details';
			}
		}
		if (journeyId == COMMON_CONSTS.GATEWAY_2_JOURNEY_ID) {
			// Format the Start date answer into a human-readable date
			const workshopAnswers = _res.locals.journeyResponse.answers.workshops ?? [];
			for (let i = 0; i < workshopAnswers.length; i++) {
				workshopAnswers[i].workshopDate =
					workshopAnswers[i].workshopDate && typeof workshopAnswers[i].workshopDate != 'string'
						? formatDateToString(workshopAnswers[i].workshopDate)
						: null;
			}
			const caseDetails = await service.db.case.findUnique({
				include: {
					gateway2Info: true
				},
				where: {
					reference
				}
			});
			const gateway2Complete = !!caseDetails?.gateway2Info?.workshopDocumentUploadedDate;
			if (gateway2Complete) {
				questions['gateway2WorkshopDocuments'].actionLink = {
					href: `/case/${reference}/gateway-2/workshop/gateway-2-workshop-documents/check`,
					text: 'View'
				};
			} else {
				delete questions['gateway2WorkshopDocuments'].actionLink;
			}
		}
		if (journeyId == COMMON_CONSTS.GATEWAY_3_JOURNEY_ID) {
			const decisionMap = {
				'1': 'Proceed to examination',
				'2': 'Resubmission required'
			};
			// Toggle the visibility/editability of the gateway3Document question

			const caseDetails = await service.db.case.findUnique({
				include: {
					gateway3Info: {
						include: {
							submissions: true
						}
					}
				},
				where: {
					reference
				}
			});
			const submissionDetails = caseDetails?.gateway3Info?.submissions;
			if (!submissionDetails) {
				throw new Error(`No submission details found for case reference '${reference}'`);
			}
			const submissionDetailsSorted = sortGateway3Submissions(submissionDetails);
			// todo update this to account for multiple gw3 submission questions
			for (let i = 0; i < submissionDetailsSorted.length; i++) {
				const submissionId = i + 1;
				const submission = submissionDetailsSorted[i];
				const gateway3Documents = `gateway3Documents-${submissionId}`;
				const gateway3Decision = `gateway3Decision-${submissionId}`;
				const decisionValue = submissionDetailsSorted[i].decision;
				const completionDate = submissionDetailsSorted[i].completionDate;
				questions[gateway3Documents].changeActionText = 'View';
				const gateway3Complete = !!submission.completionDate;
				(questions[gateway3Documents] as any).config.actionButtonVisibleInSummary = gateway3Complete;
				questions[gateway3Documents].editable = !gateway3Complete;
				if (gateway3Complete) {
					if (!decisionValue) {
						throw Error('Decision was null but should be filled in if gateway3CompletionDate is set');
					}
					questions[gateway3Decision].actionLink = {
						href: `/case/${reference}/${COMMON_CONSTS.GATEWAY_3_REPORT_JOURNEY_ID}/gateway-3-submission-${submissionId}/gateway-3-document-${submissionId}/check`,
						text: 'View'
					};
					const decisionText = decisionValue ? decisionMap[decisionValue as keyof typeof decisionMap] : null;
					const formattedCompletionDate = completionDate
						? new Intl.DateTimeFormat('en-GB', {
								day: 'numeric',
								month: 'long',
								timeZone: 'Europe/London',
								year: 'numeric'
							}).format(completionDate)
						: null;
					questions[gateway3Decision].formatSummaryValue = () =>
						decisionText ? `${decisionText}\nIssued on ${formattedCompletionDate}` : 'Not started';
				} else {
					// Reset for different journey
					delete questions[gateway3Decision].actionLink;
					questions[gateway3Decision].formatSummaryValue = () => 'Not started';
				}
			}
		}
		if (journeyId == 'examination') {
			// Format the Start date answer into a human-readable date
			const hearingAnswers = _res.locals.journeyResponse.answers.hearings ?? [];
			for (let i = 0; i < hearingAnswers.length; i++) {
				hearingAnswers[i].hearingDate =
					hearingAnswers[i].hearingDate && typeof hearingAnswers[i].hearingDate != 'string'
						? formatDateToString(hearingAnswers[i].hearingDate)
						: null;
			}
		}
		if (journeyId == COMMON_CONSTS.EXAMINATION_JOURNEY_ID) {
			const caseDetails = await service.db.case.findUnique({
				include: {
					examinationInfo: {
						include: {
							planPauseHistory: true
						}
					}
				},
				where: {
					reference
				}
			});
			const pauseDetails = caseDetails?.examinationInfo?.planPauseHistory;
			if (!pauseDetails) {
				throw new Error(`No pause details found for case reference '${reference}'`);
			}
			const pauseQuestionPrefixes = [
				'examinationPauseStartDate',
				'examinationPauseDetail',
				'examinationPauseEndDate',
				'examinationRestartDetail'
			];
			pauseQuestionPrefixes.forEach((prefix) => {
				const questionName = `${prefix}-1`;
				questions[questionName].actionLink = {
					href: `/case/${reference}/examination-pause/pause-examination/${questions[questionName].url}`,
					text: 'View'
				};
			});
			for (let i = 2; i <= pauseDetails.length; i++) {
				pauseQuestionPrefixes.forEach((prefix) => {
					const questionName = `${prefix}-${i}`;
					questions[questionName].actionLink = {
						href: `/case/${reference}/examination-pause/pause-examination/${questions[questionName].url}`,
						text: 'View'
					};
				});
			}
		}
		next();
	});
}
