import type { AsyncRequestHandler } from '@planning-inspectorate/core/util';
import type { ManageService } from '#service';
import { type SaveDataFn, type Question } from '@planning-inspectorate/dynamic-forms';
import type { Request, Response, NextFunction } from 'express';
import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import * as authSession from '@planning-inspectorate/core/auth';
import { questions } from './questions.ts';
import type { CaseModel } from '@pins/local-plans-database/src/client/models/Case.ts';
import { type FileUploaderSession } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import { DocumentUtil } from '@pins/local-plans-lib/util/documents.ts';
import { type FileUploaderQuestionProps } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import { fileUploadQuestionProperties } from './questions.ts';
import { CUSTOM_COMPONENTS, CUSTOM_COMPONENT_CLASSES } from '../layouts/index.ts';
import { getSubmissionCheckForQuestion } from './submission-check/submission-check-factory.ts';
import { getPageLoadHandlerForPage } from './overview-data-handlers/overview-page-load-handler-factory.ts';
import { asyncHandler } from '@planning-inspectorate/core/util';
import multer from 'multer';
import { resolveCaseHeaderStatus } from '../../classes/status-tag-classes.ts';
import { gateway2SetIds } from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';
import { sortGateway3Submissions } from '#util/util.ts';
import type FileUploaderQuestion from '@pins/local-plans-lib/forms/custom-components/file-uploader/question.ts';
import { journeyQuestions } from './journey.ts';
import { COMMON_CONSTS } from '../../classes/common-consts.ts';
import { OverviewSaveController } from './save/overview-save-controller.ts';
import { Gateway1SaveController } from './save/gateway-1-save-controller.ts';
import { Gateway2SaveController } from './save/gateway-2-save-controller.ts';
import { Gateway3SaveController } from './save/gateway-3-save-controller.ts';
import { ExaminationSaveController } from './save/examination-save-controller.ts';

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

		let updated: boolean;
		const firstSegmentUrl = getFirstSegmentOfUrl(req.url);
		switch (firstSegmentUrl) {
			case COMMON_CONSTS.OVERVIEW: {
				updated = await new OverviewSaveController(
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
				updated = await new Gateway1SaveController(service, req, reference).prepareAndSave(data.answers);
				break;
			}
			case COMMON_CONSTS.GATEWAY_2_JOURNEY_ID: {
				updated = await new Gateway2SaveController(service, req, reference).prepareAndSave(data.answers);
				break;
			}
			case COMMON_CONSTS.GATEWAY_3_JOURNEY_ID: {
				updated = await new Gateway3SaveController(service, req, reference).prepareAndSave(data.answers);
				break;
			}
			case COMMON_CONSTS.EXAMINATION_JOURNEY_ID: {
				updated = await new ExaminationSaveController(service, req, reference).prepareAndSave(data.answers);
				break;
			}
			default: {
				logger.info(`url - ${req.url} not found`);
				return res.status(404).render('views/errors/404.njk');
			}
		}
		if (updated) {
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

export function buildGetJourneyMiddleware(service: ManageService, journeyId: string): AsyncRequestHandler {
	return async (req, res, next) => {
		const { db, logger } = service;
		const reference = getParam(req.params.reference);

		const caseRecord = await db.case.findUnique({
			where: { reference },
			select: { id: true, planTitle: true }
		});

		if (!caseRecord) return res.status(404).render('views/errors/404.njk');

		res.locals.planTitle = caseRecord.planTitle;
		res.locals.reference = reference;

		if (req.session.alertMessage) {
			res.locals.alertMessage = req.session.alertMessage;
			delete req.session.alertMessage;
		}
		if (req.session.alertMessageStatus) {
			res.locals.alertMessageStatus = req.session.alertMessageStatus;
			delete req.session.alertMessageStatus;
		}

		const journey1Data = await db.gateway1Info.findUnique({ where: { caseId: caseRecord.id } });
		const journey2Data = await db.gateway2Info.findUnique({
			where: {
				caseId: caseRecord.id
			},
			include: {
				workshops: true
			}
		});

		const gateway2Documents = await db.document.findMany({
			where: {
				caseId: caseRecord.id,
				documentSetId: { in: gateway2SetIds }
			}
		});

		const headerStatus = resolveCaseHeaderStatus(gateway2Documents, journey1Data, journey2Data);
		res.locals.headerStatusText = headerStatus.headerStatusText;
		res.locals.headerStatusClasses = headerStatus.headerStatusClasses;

		const currentPage = getFirstSegmentOfUrl(req.url);
		let handlerClass;
		try {
			handlerClass = getPageLoadHandlerForPage(currentPage);
		} catch {
			logger.error(`Unknown page ${currentPage} for case ${reference}`);
			return;
		}

		const handler = new handlerClass();
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
	db: PrismaClient,
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
		if (typeof value === 'boolean') {
			return value ? 'Sound' : 'Unsound';
		}
		if (typeof value === 'string') {
			return value == 'yes' ? 'Sound' : 'Unsound';
		}
		return value;
	}

	if (typeof value === 'boolean') {
		return value;
	}
	const entraUserQuestions = new Set([
		'caseOfficer',
		'examiningInspector1',
		'examiningInspector2',
		'examiningInspector3'
	]);
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
 * Retrieves the plan reference from the params and creates the file upload session key.
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
	return `${req.params.planReference}:${fieldName}`;
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
			req.session.alertMessage = 'Gateway 2 report issued';
			req.session.alertMessageStatus = 'success';
		} else {
			// Alert message is saved as a session variable and inserted into the view by buildGetJourneyMiddleware
			req.session.alertMessage = 'Gateway 2 report already issued';
			req.session.alertMessageStatus = 'important';
		}
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
			req.session.alertMessage = 'Gateway 2 workshop documents issued';
			req.session.alertMessageStatus = 'success';
		} else {
			// Alert message is saved as a session variable and inserted into the view by buildGetJourneyMiddleware
			req.session.alertMessage = 'Gateway 2 workshopDocuments already issued';
			req.session.alertMessageStatus = 'important';
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
			req.session.alertMessage = 'Signed SLA uploaded. LPA can proceed to Gateway 2 submission';
			req.session.alertMessageStatus = 'success';
		} else {
			// Alert message is saved as a session variable and inserted into the view by buildGetJourneyMiddleware
			req.session.alertMessage = 'SLA already issued';
			req.session.alertMessageStatus = 'important';
		}
		res.redirect(`/case/${encodeURIComponent(caseReference)}/${encodeURIComponent(journeyId)}`);
		return;
	};
}

export function issueGateway3Document(service: ManageService, journeyId: string): AsyncRequestHandler {
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
		const lastSubmission = existingSubmissions.at(-1);
		if (!lastSubmission) {
			throw Error('Could not find a submission');
		}
		if (!lastSubmission?.completionDate) {
			// Try to update the reportIssuedDate
			const completionDate = new Date();
			lastSubmission.completionDate = new Date();
			if (lastSubmission.decision == '2') {
				// If a submission was rejected by the inspector, then add a new gw3 submission details block
				existingSubmissions.push({
					id: crypto.randomUUID(),
					decision: null,
					completionDate: null,
					gateway3InfoId: lastSubmission.gateway3InfoId
				});
			}
			const account = authSession.getAccount(req.session);
			const currentUser = account?.name ?? 'Unknown';
			req.params.question = COMMON_CONSTS.GATEWAY_3_REPORT_ISSUED_DATE_QUESTION;
			await new Gateway3SaveController(service, req, caseReference).prepareAndSave({
				submissions: existingSubmissions
			});
			await updateCaseHistory(
				service,
				req,
				service.db,
				{
					gateway3Documents: null // Will be overridden by overrideLabels
				},
				{},
				caseReference,
				currentUser,
				{
					gateway3Documents: `Gateway 3 decision issued on ${await formatCaseHistoryValue(service, req, '', completionDate)}`
				}
			);
			// Alert message is saved as a session variable and inserted into the view by buildGetJourneyMiddleware
			req.session.alertMessage = 'Gateway 3 decision issued';
			req.session.alertMessageStatus = 'success';
		} else {
			// Alert message is saved as a session variable and inserted into the view by buildGetJourneyMiddleware
			req.session.alertMessage = 'Gateway 3 decision already issued';
			req.session.alertMessageStatus = 'important';
		}
		res.redirect(`/case/${encodeURIComponent(caseReference)}/${encodeURIComponent(journeyId)}`);
		return;
	};
}

// Builds the URL for the current file upload question.
export function redirectToFileUploaderQuestion(req: Request) {
	const planPath = req.params.planReference ? `/${req.params.planReference}` : '';
	// Any questions that need to route to new subjourneys can be defined here
	if (req.params.question === COMMON_CONSTS.GATEWAY_2_REPORT_QUESTION) {
		return `${req.baseUrl}${planPath}/gateway-2/${req.params.section}/${req.params.question}`;
	}
	if (req.params.question === COMMON_CONSTS.SIGNED_SLA_QUESTION) {
		return `${req.baseUrl}${planPath}/gateway-1/${req.params.section}/${req.params.question}`;
	}
	if (req.params.question == COMMON_CONSTS.GATEWAY_2_WORKSHOP_DOCUMENTS_QUESTION) {
		return `${req.baseUrl}${planPath}/gateway-2/${req.params.section}/${req.params.question}`;
	}
	const journey = req.url.split(String(req.params.section))[0];
	return `${req.baseUrl}${planPath}${journey}${req.params.section}/${req.params.question}`;
}

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
		if (journeyId == 'gateway-3') {
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
				questions[gateway3Documents].editable = !gateway3Complete;
				(questions[gateway3Documents] as unknown as FileUploaderQuestion).config.actionButtonVisibleInSummary =
					gateway3Complete;
				if (gateway3Complete) {
					if (!decisionValue) {
						throw Error('Decision was null but should be filled in if gateway3CompletionDate is set');
					}
					questions[gateway3Decision].actionLink = {
						href: `/case/${reference}/gateway-3/gateway-3-submission-${submissionId}/gateway-3-document-${submissionId}/check`,
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
		next();
	});
}
