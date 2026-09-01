import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { ManageService } from '#service';
import { JourneyResponse, type SaveDataFn } from '@planning-inspectorate/dynamic-forms';
import type { Request, Response, NextFunction } from 'express';
import type { Prisma, PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import * as authSession from '../../auth/session.service.ts';
import { questions } from './questions.ts';
import type { CaseModel } from '@pins/local-plans-database/src/client/models/Case.ts';
import { type FileUploaderSession } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import { DocumentUtil } from '@pins/local-plans-lib/util/documents.ts';
import { type FileUploaderQuestionProps } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import { fileUploadQuestionProperties } from './questions.ts';
import { CUSTOM_COMPONENTS, CUSTOM_COMPONENT_CLASSES } from '../layouts/index.ts';
import multer from 'multer';

type ManageListAction = 'edit' | 'remove' | undefined;

/** the name of the contacts section. */
const CONTACTS_SECTION = 'contacts';

interface CaseOverviewInput {
	planTitle?: string;
	planType?: string;
	planBand?: string;
	caseOfficer?: string;
	lpa?: string;
	lpaCode?: string;
	lpaContact?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	phone?: string;
	examinationWebsite?: string;
	// assessor for Gateway 2
	assessorName?: string;
	gateway3AssessorName?: string;
	assessorGateway3?: string;
	examiningInspector1?: string;
	examiningInspector2?: string;
	examiningInspector3?: string;
	qaInspector1?: string;
	qaInspector2?: string;
	qaInspector3?: string;
	//programme Officer for gateway 3
	programmeOfficerFirstName?: string;
	programmeOfficerLastName?: string;
	programmeOfficerEmail?: string;
}

interface Gateway1Input {
	noticeOfIntention?: Date;
	expectedGateway1Date?: Date;
	completedGateway1Date?: Date;
	slaSentDate?: Date;
	signedSla?: any;
	slaReceivedDate?: Date;
	dsaChecked?: string;
}

interface Gateway2Input {
	expectedDate?: Date;
	actualDate?: Date;
	validDate?: Date;
	assessorName?: string;
	assessorDate?: Date;
	assessorAppointmentDate?: Date;
	workshopDate?: Date;
	workshopVenue?: string;
	reportIssuedDate?: Date;
	reportPublishedByLPA?: Date;
	gateway2Report?: any;
}

interface ExaminationInput {
	expectedSubmissionForExaminationDate?: Date;
	submissionForExaminationDate?: Date;
	examiningInspector1?: string;
	examiningInspector2?: string;
	examiningInspector3?: string;
	examiningInspectorAppointmentDate?: Date;
	examinationWebsite?: string;
	QADate?: Date;
	reportSentToPanelDate?: Date;
	panelResponseToInspectorDate?: Date;
	letterSentToMHCLGDate?: Date;
	letterIssueDate?: Date;
	factCheckDateReceivedFromInspector?: Date;
	factCheckDueDate?: Date;
	factCheckActualDate?: Date;
	factCheckReceivedBackFromLPADate?: Date;
	finalReportIssueDate?: Date;
	qaInspector1?: string;
	qaInspector2?: string;
	qaInspector3?: string;
	planPauseStartDate?: Date;
	planPauseEndDate?: Date;
	withdrawnDate?: Date;
	isSound?: boolean;
	soundUnsoundDate?: Date;
	adoptionDate?: Date;
	approvedForCILDate?: Date;
}

interface Gateway3Input {
	expectedDate?: Date;
	actualDate?: Date;
	assessorName?: string;
	assessorAppointmentDate?: Date;
	completionDate?: Date;
	programmeOfficerFirstName?: string;
	programmeOfficerLastName?: string;
	programmeOfficerEmail?: string;
	examinationWebsite?: string;
	decision?: string;
}

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
export const fileUploadQuestionConfigs = fileUploadQuestionProperties as FileUploadQuestion[];
// URL list for the file uploader middleware to recognise upload pages.
export const fileUploadQuestionUrls = fileUploadQuestionConfigs.map((questionConfig) => questionConfig.url);
// Fast lookup for POST routes such as `/local-plan-timetable/upload-documents`.
export const fileUploadQuestionsByUrl = new Map(
	fileUploadQuestionConfigs.map((questionConfig) => [questionConfig.url, questionConfig])
);

/** * Returns a handler that applies a single case-overview edit to the database. * The action (edit / remove / update) is derived from the route params. */
export function updateCaseField(service: ManageService): SaveDataFn {
	return async ({ req, res, data }: { req: Request; res: Response; data: Record<string, any> }): Promise<void> => {
		console.log('updateCaseField called');
		const { db, logger } = service;

		const reference = getParam(req.params.reference);
		const section = getParam(req.params.section);
		const action = req.params.manageListAction as ManageListAction;
		const currentItemId = getParam(req.params.manageListItemId);

		if (action === 'remove') {
			await removeItem({ db, reference, section, currentItemId });
			return;
		}

		let updated;
		const firstSegmentUrl = getFirstSegmentOfUrl(req.url);
		switch (firstSegmentUrl) {
			case 'overview':
				updated = await updateOverview(
					db,
					trimStringValues(data.answers as CaseOverviewInput),
					reference,
					action,
					section,
					currentItemId,
					getParam(req.params.question)
				);
				break;
			case 'gateway-1':
				updated = await updateGateway1(
					db,
					trimStringValues(data.answers as Gateway1Input),
					reference,
					req.params.question as string
				);
				break;
			case 'gateway-2':
				updated = await updateGateway2(
					db,
					trimStringValues(data.answers as Gateway2Input),
					reference,
					req.params.question as string
				);
				break;
			case 'gateway-3':
				updated = await updateGateway3(
					db,
					trimStringValues(data.answers as Gateway3Input),
					reference,
					req.params.question as string
				);
				break;
			case 'examination':
				updated = await updateExamination(
					db,
					trimStringValues(data.answers as ExaminationInput),
					reference,
					req.params.question as string
				);
				break;
			default:
				logger.info(`url - ${req.url} not found`);
				return res.status(404).render('views/errors/404.njk');
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

async function updateOverview(
	db: PrismaClient,
	answers: CaseOverviewInput,
	reference: string,
	action?: string,
	section?: string,
	currentItemId?: string,
	question?: string
) {
	if (question === 'assessor-gateway-2' || question === 'assessor-gateway-2') {
		await updateGateway2(db, { assessorName: answers.assessorName }, reference, question);
		return true;
	}
	if (question === 'assessor-gateway-3') {
		await updateGateway3(db, { assessorName: answers.gateway3AssessorName }, reference, question);
		return true;
	}
	if (question === 'programme-officer') {
		await updateGateway3(
			db,
			{
				programmeOfficerFirstName: answers.programmeOfficerFirstName,
				programmeOfficerLastName: answers.programmeOfficerLastName,
				programmeOfficerEmail: answers.programmeOfficerEmail
			},
			reference
		);
		return true;
	}

	const lpaName = (questions.lpa.options || []).find((opt: any) => opt.value === answers.lpa)?.text || '';
	// Editing a contact's details (incl. changing that contact's LPA)
	if (section === CONTACTS_SECTION && action === 'edit' && currentItemId) {
		await db.contact.update({
			where: { id: currentItemId },
			data: buildContactData(answers, lpaName)
		});
		return true;
	}

	// Changing the LPA associated with the *case*:
	// replace the old LPA (currentItemId) with the newly selected one (answers.lpa)
	if (question === 'check-lpas' && answers.lpa) {
		await db.case.update({
			where: { reference: reference },
			data: {
				lpas: {
					connectOrCreate: {
						where: {
							lpaCode: answers.lpa
						},
						create: {
							lpaCode: answers.lpa,
							lpaName: lpaName
						}
					},
					disconnect: currentItemId ? [{ lpaCode: currentItemId }] : undefined
				}
			}
		});
		return true;
	}

	if (question === 'check-contact-details') {
		if (!currentItemId) return false;
		const contactData = buildContactData(answers, lpaName);
		await db.contact.upsert({
			where: { id: currentItemId },
			create: {
				...contactData,
				cases: { connect: { reference: reference } }
			},
			update: contactData
		});
		return true;
	}

	if (question === 'examining-inspector-1') {
		return await updateExamination(db, { examiningInspector1: answers.examiningInspector1 }, reference, question);
	}
	if (question === 'examining-inspector-2') {
		return await updateExamination(db, { examiningInspector2: answers.examiningInspector2 }, reference, question);
	}
	if (question === 'examining-inspector-3') {
		return await updateExamination(db, { examiningInspector3: answers.examiningInspector3 }, reference, question);
	}
	if (question === 'examination-website') {
		return await updateExamination(db, { examinationWebsite: answers.examinationWebsite }, reference, question);
	}

	if (question === 'qa-inspector-1') {
		return await updateExamination(db, { qaInspector1: answers.qaInspector1 }, reference, question);
	}
	if (question === 'qa-inspector-2') {
		return await updateExamination(db, { qaInspector2: answers.qaInspector2 }, reference, question);
	}
	if (question === 'qa-inspector-3') {
		return await updateExamination(db, { qaInspector3: answers.qaInspector3 }, reference, question);
	}

	// Updating case (scalar) details + any newly added contact / LPA
	const { ...scalars } = answers;

	await db.case.update({
		where: { reference: reference },
		data: scalars
	});
	return true;
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

export type UpdateFunction = (
	db: PrismaClient,
	answers: any,
	caseReference: string,
	question?: string
) => Promise<boolean>;

export async function updateGateway1(
	db: PrismaClient,
	answers: Gateway1Input,
	caseReference: string,
	question?: string
) {
	const caseId = await resolveCaseIdFromReference(db, caseReference);

	if (question == 'signed-sla') {
		answers.slaReceivedDate = new Date();
	}
	if (answers) {
		await db.gateway1Info.upsert({
			where: { caseId },
			update: { ...answers },
			create: { caseId, ...answers }
		});
	}
	return true;
}

export async function updateGateway2(
	db: PrismaClient,
	answers: Gateway2Input,
	caseReference: string,
	question?: string
) {
	const caseId = await resolveCaseIdFromReference(db, caseReference);

	if (question === 'gateway-2-assessor' || question === 'assessor-gateway-2') {
		answers.assessorAppointmentDate = new Date();
	}
	if (answers) {
		await db.gateway2Info.upsert({
			where: { caseId },
			update: { ...answers },
			create: { caseId, ...answers }
		});
	}
	return true;
}

export async function updateGateway3(
	db: PrismaClient,
	answers: Gateway3Input,
	caseReference: string,
	question?: string
) {
	const caseId = await resolveCaseIdFromReference(db, caseReference);
	if (question === 'examination-website') {
		return await updateExamination(db, { examinationWebsite: answers.examinationWebsite }, caseReference, question);
	}
	if (question === 'assessor-gateway-3' || question === 'gateway-3-assessor-name') {
		answers.assessorAppointmentDate = new Date();
	}
	if (question === 'gateway-3-document') {
		// For handling the save button
		return true;
	}
	if (answers) {
		await db.gateway3Info.upsert({
			where: { caseId },
			update: { ...answers },
			create: { caseId, ...answers }
		});
	}
	return true;
}

export async function updateExamination(
	db: PrismaClient,
	answers: ExaminationInput,
	caseReference: string,
	question?: string
) {
	const caseId = await resolveCaseIdFromReference(db, caseReference);
	const inspectorQuestions = ['examining-inspector-1', 'examining-inspector-2', 'examining-inspector-3'];
	if (question && inspectorQuestions.includes(question)) {
		answers.examiningInspectorAppointmentDate = new Date();
	}
	if (answers) {
		await db.examinationInfo.upsert({
			where: { caseId },
			update: { ...answers },
			create: { caseId, ...answers }
		});
	}
	return true;
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

/** Builds the shared contact `data` payload used by both create and update. */
function buildContactData(formData: CaseOverviewInput, lpaName: string): Prisma.ContactCreateWithoutCasesInput {
	const { firstName = '', lastName = '', email = '', phone = '', lpaCode, lpaContact } = formData;
	return {
		firstName,
		lastName,
		email,
		phoneNumber: phone,
		lpa: { connectOrCreate: lpaConnectOrCreate(lpaCode || lpaContact || '', lpaName) }
	};
}

/** A reusable `connectOrCreate` clause for an LPA by its code. */
function lpaConnectOrCreate(lpaCode: string, lpaName: string): Prisma.LPACreateOrConnectWithoutContactsInput {
	return { where: { lpaCode }, create: { lpaCode, lpaName } };
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

		const currentPage = getFirstSegmentOfUrl(req.url);
		switch (currentPage) {
			case 'overview': {
				const overviewData = await getOverviewData(db, reference);
				if (!overviewData) return res.status(404).render('views/errors/404.njk');
				const journeyResponse = new JourneyResponse(journeyId, '', overviewData);
				res.locals.journeyResponse = journeyResponse;
				res.locals.currentCase = overviewData;
				res.locals.baseUrl = `/case/${encodeURIComponent(reference)}`;
				res.locals.currentSection = (req.query?.section as string) ?? '';
				journeyResponse.answers.assessorName = overviewData.gateway2Info?.assessorName;
				journeyResponse.answers.programmeOfficerFirstName = overviewData.gateway3Info?.programmeOfficerFirstName;
				journeyResponse.answers.programmeOfficerLastName = overviewData.gateway3Info?.programmeOfficerLastName;
				journeyResponse.answers.programmeOfficerEmail = overviewData.gateway3Info?.programmeOfficerEmail;
				journeyResponse.answers.gateway3AssessorName = overviewData.gateway3Info?.assessorName;
				journeyResponse.answers.checkLpas = overviewData.lpas.map((lpa) => ({
					id: lpa.lpaCode,
					lpa: lpa.lpaCode
				}));
				journeyResponse.answers.contactDetails = overviewData.contacts.map((contact) => ({
					...contact,
					phone: contact.phoneNumber,
					lpaContact: contact.lpaCode
				}));
				journeyResponse.answers.examiningInspector1 = overviewData.examinationInfo?.examiningInspector1;
				journeyResponse.answers.examiningInspector2 = overviewData.examinationInfo?.examiningInspector2;
				journeyResponse.answers.examiningInspector3 = overviewData.examinationInfo?.examiningInspector3;
				journeyResponse.answers.examinationWebsite = overviewData.examinationInfo?.examinationWebsite;
				journeyResponse.answers.qaInspector1 = overviewData.examinationInfo?.qaInspector1;
				journeyResponse.answers.qaInspector2 = overviewData.examinationInfo?.qaInspector2;
				journeyResponse.answers.qaInspector3 = overviewData.examinationInfo?.qaInspector3;

				if (next) next();
				return;
			}

			case 'gateway-1': {
				const journey1Data = await db.gateway1Info.findUnique({ where: { caseId: caseRecord.id } });
				await addUploadedDocumentDetailsToAnswers(service, caseRecord, req, journey1Data);
				res.locals.journeyResponse = new JourneyResponse(journeyId, '', journey1Data);
				if (
					req.method === 'POST' &&
					req.params.question == 'signed-sla' &&
					req.originalUrl.endsWith(req.params.question)
				) {
					// TODO need to check if there are documents - only redirect if there are documents
					res.redirect(303, 'signed-sla/check');
					return;
				}
				if (next) next();
				return;
			}

			case 'gateway-2': {
				const journey2Data = await db.gateway2Info.findUnique({ where: { caseId: caseRecord.id } });
				await addUploadedDocumentDetailsToAnswers(service, caseRecord, req, journey2Data);
				res.locals.journeyResponse = new JourneyResponse(journeyId, '', journey2Data);
				if (
					req.method === 'POST' &&
					req.params.question == 'gateway-2-report' &&
					req.originalUrl.endsWith(req.params.question)
				) {
					const uploadedGateway2Reports =
						req.session.fileUploader?.[fileUploaderCaseSessionKeyForField(req, 'gateway2Report')]?.uploadedFiles ?? [];

					if (uploadedGateway2Reports.length > 0) {
						res.redirect(303, 'gateway-2-report/check');
						return;
					}
				}

				if (next) next();
				return;
			}

			case 'gateway-3': {
				const journey3Data = await db.gateway3Info.findUnique({ where: { caseId: caseRecord.id } });
				await addUploadedDocumentDetailsToAnswers(service, caseRecord, req, journey3Data);
				const journey4Data = await db.examinationInfo.findUnique({ where: { caseId: caseRecord.id } });
				res.locals.journeyResponse = new JourneyResponse(journeyId, '', journey3Data);
				res.locals.journeyResponse.answers.examinationWebsite = journey4Data?.examinationWebsite;
				// Flow for uploading a gateway 3 document
				if (
					req.method === 'POST' &&
					req.params.question == 'gateway-3-decision' &&
					req.originalUrl.endsWith(req.params.question)
				) {
					const caseReference = getParam(req.params.reference);
					await updateGateway3(
						db,
						{
							decision: req.body.decision
						},
						caseReference,
						'gateway-3-decision'
					);
					res.redirect(303, 'gateway-3-document');
					return;
				}
				if (
					req.method === 'POST' &&
					req.params.question == 'gateway-3-document' &&
					req.originalUrl.endsWith(req.params.question)
				) {
					// TODO need to check if there are documents - only redirect if there are documents
					res.redirect(303, 'gateway-3-document/check');
					return;
				}
				if (next) next();
				return;
			}

			case 'examination': {
				const journey4Data = await db.examinationInfo.findUnique({ where: { caseId: caseRecord.id } });
				res.locals.journeyResponse = new JourneyResponse(journeyId, '', journey4Data);
				let isSound: string | null = null;
				if (typeof journey4Data?.isSound === 'boolean') {
					isSound = journey4Data?.isSound ? 'yes' : 'no';
				}
				res.locals.journeyResponse.answers.isSound = isSound;
				if (next) next();
				return;
			}

			default:
				logger.error(`Unknown page ${currentPage} for case ${reference}`);
		}
	};
}

export function buildCheckReportMiddleware(service: ManageService, journeyId: string): AsyncRequestHandler {
	return async (req, res) => {
		const section = getParam(req.params.section);
		const questionUrl = getParam(req.params.question);
		const questionConfig = fileUploadQuestionConfigs.find((question) => question.url == questionUrl);
		if (!questionConfig) {
			throw new Error(`Could not find question config for question url '${questionUrl}'`);
		}
		const questionFieldName = questionConfig.fieldName;
		const uploadedFiles =
			req.session.fileUploader?.[fileUploaderCaseSessionKeyForField(req, questionFieldName)]?.uploadedFiles ?? [];
		// Todo need to add error handling for 0 files - no flow defined right now
		const caseReference = getParam(req.params.reference);
		const backLinkUrl = `${req.originalUrl.substring(0, req.originalUrl.lastIndexOf('/'))}`;
		// Extra details needed to render the inner notification on the page
		const questionDetailsMap: Record<
			string,
			{
				title: string;
				dbInfo: any;
				completeIndicatorFieldName: string;
				submitButtonText: string;
				dateUploadedQuestion: string | undefined;
			}
		> = {
			'signed-sla': {
				title: 'Check signed SLA and issue notification',
				dbInfo: service.db.gateway1Info,
				completeIndicatorFieldName: 'slaSentDate',
				submitButtonText: 'Confirm and issue notification',
				dateUploadedQuestion: 'slaReceivedDate'
			},
			'gateway-2-report': {
				title: 'Check Gateway 2 report details and issue notification',
				dbInfo: service.db.gateway2Info,
				completeIndicatorFieldName: 'reportIssuedDate',
				submitButtonText: 'Issue report',
				dateUploadedQuestion: undefined
			},
			'gateway-3-document': {
				title: 'Check gateway 3 decision and report details',
				dbInfo: service.db.gateway3Info,
				completeIndicatorFieldName: 'completionDate',
				submitButtonText: 'Issue decision',
				dateUploadedQuestion: undefined
			}
		};
		const questionDetails = questionDetailsMap[questionConfig.url];
		if (!questionDetails) {
			throw new Error(
				`Could not find details for question '${questionConfig.url}' in buildCheckReportMiddleware::questionDetailsMap`
			);
		}
		const dateUploadedQuestion = questionDetails.dateUploadedQuestion
			? questions[questionDetails.dateUploadedQuestion]
			: undefined;
		const caseId = await resolveCaseIdFromReference(service.db, caseReference);
		const completeIndicatorFieldName = questionDetails.completeIndicatorFieldName;
		const existingGatewayDetails = await questionDetails.dbInfo.findUnique({
			select: {
				[completeIndicatorFieldName]: true,
				...(questionDetails.dateUploadedQuestion ? { [questionDetails.dateUploadedQuestion]: true } : {})
			},
			where: {
				caseId: caseId
			}
		});
		const alreadyComplete = existingGatewayDetails?.[completeIndicatorFieldName];
		const notificationPreviewTemplate = questionUrl + (alreadyComplete ? '-complete' : '');
		const documentUploadDate = questionDetails.dateUploadedQuestion
			? existingGatewayDetails[questionDetails.dateUploadedQuestion]
			: (uploadedFiles[0]?.dateCreated ?? undefined);
		const defaultAdditionalField: { name: string; value: string | null; url: string | undefined } = {
			name: 'Date uploaded',
			value: documentUploadDate
				? new Intl.DateTimeFormat('en-GB', {
						day: 'numeric',
						month: 'long',
						timeZone: 'Europe/London',
						year: 'numeric'
					}).format(documentUploadDate)
				: null,
			url: questionDetails.dateUploadedQuestion ? dateUploadedQuestion.url : undefined
		};
		const additionalFieldsMap: Record<string, [{ name: string; value: string | null; url: string | undefined }]> = {
			'signed-sla': [defaultAdditionalField],
			'gateway-2-report': [defaultAdditionalField],
			'gateway-3-document': [
				{
					name: 'Outcome',
					value: 'Blank for now',
					url: undefined
				}
			]
		};
		const additionalFields = additionalFieldsMap[questionConfig.url];
		res.render('views/layouts/submit-documents-check-your-answers', {
			titleHeading: questionDetails.title,
			uploadedFiles: uploadedFiles,
			caseReference: caseReference,
			journeyId: journeyId,
			section: section,
			question: questionUrl,
			backLink: backLinkUrl,
			notificationPreviewTemplate: notificationPreviewTemplate,
			submitButtonText: questionDetails.submitButtonText,
			additionalFields: additionalFields
		});
		return;
	};
}
/**
 * Load the documents for the given case and prepopulate the answer fields with their names
 * @param service The manage service
 * @param currentCase The case from the database
 * @param req The request object
 * @param answers The answers that the details should be added to
 */
async function addUploadedDocumentDetailsToAnswers(
	service: ManageService,
	currentCase: any,
	req: Request,
	answers: any
) {
	const request = req as UploadDocumentRequest;
	request.currentCase = currentCase;
	const documentSetIdsByFolderName = await DocumentUtil.getDocumentSetIdsByFolderName(
		service,
		fileUploadQuestionConfigs.map((questionConfig) => questionConfig.url)
	);
	for (const questionConfig of fileUploadQuestionConfigs) {
		const documentSetId = documentSetIdsByFolderName.get(questionConfig.url);
		if (!documentSetId) {
			throw new Error(`Missing document set reference data for "${questionConfig.url}". Run the database static seed.`);
		}

		const uploadedFiles = await DocumentUtil.loadUploadedDocuments(service, currentCase.id, documentSetId);
		req.session.fileUploader = {
			...request.session.fileUploader,
			[fileUploaderCaseSessionKeyForField(req, questionConfig.fieldName)]: {
				uploadedFiles
			}
		};
		if (uploadedFiles.length > 0) {
			answers[questionConfig.fieldName] = uploadedFiles;
		} else {
			delete answers[questionConfig.fieldName];
		}
	}
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
		{ text: 'Overview', href: `${baseUrl}/overview` },
		{ text: 'Timetable', href: '#' },
		{ text: 'Gateway 1', href: `${baseUrl}/gateway-1` },
		{ text: 'Gateway 2', href: `${baseUrl}/gateway-2` },
		{ text: 'Gateway 3', href: `${baseUrl}/gateway-3` },
		{ text: 'Examination', href: `${baseUrl}/examination` },
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

async function getOverviewData(db: PrismaClient, reference: string) {
	return db.case.findUnique({
		where: { reference },
		include: {
			lpas: true,
			contacts: true,
			gateway2Info: {
				select: {
					assessorName: true
				}
			},
			gateway3Info: {
				select: {
					programmeOfficerFirstName: true,
					programmeOfficerLastName: true,
					programmeOfficerEmail: true,
					assessorName: true
				}
			},
			caseHistories: {
				orderBy: { date: 'desc' }
			},
			examinationInfo: {
				select: {
					examiningInspector1: true,
					examiningInspector2: true,
					examiningInspector3: true,
					examinationWebsite: true,
					qaInspector1: true,
					qaInspector2: true,
					qaInspector3: true
				}
			}
		}
	});
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
						// TODO: Get user once authentication is implemented
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
	console.log('fetched question');
	console.log(question);
	if (entraUserQuestions.has(question)) {
		console.log('is an entra question');
		const entraClient = service.getEntraClient(req.session as authSession.SessionWithAuth);
		console.log('entraClient');
		console.log(entraClient);
		if (entraClient) {
			const fetchedDisplayName = await entraClient.getUserDisplayName(String(value));
			if (fetchedDisplayName) {
				console.log('fetchedDisplayName');
				console.log(fetchedDisplayName);
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
			await updateGateway2(
				service.db,
				{
					reportIssuedDate: reportIssuedDate
				},
				caseReference,
				'gateway-2-report-issued-date'
			);
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
			await updateGateway1(
				service.db,
				{
					slaSentDate: slaSentDate
				},
				caseReference,
				'sla-sent-date'
			);
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
		res.redirect(`/case/${encodeURIComponent(caseReference)}/${journeyId}`);
		return;
	};
}

export function issueGateway3Document(service: ManageService, journeyId: string): AsyncRequestHandler {
	return async (req, res) => {
		const caseReference = getParam(req.params.reference);
		const caseId = await resolveCaseIdFromReference(service.db, caseReference);
		const existingGatewayDetails = await service.db.gateway3Info.findUnique({
			select: {
				completionDate: true
			},
			where: {
				caseId: caseId
			}
		});
		if (!existingGatewayDetails?.completionDate) {
			// Try to update the reportIssuedDate
			const completionDate = new Date();
			const account = authSession.getAccount(req.session);
			const currentUser = account?.name ?? 'Unknown';
			await updateGateway3(
				service.db,
				{
					completionDate: completionDate
				},
				caseReference,
				'gateway-3-report-issued-date'
			);
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
		res.redirect(`/case/${encodeURIComponent(caseReference)}/${journeyId}`);
		return;
	};
}

// Builds the URL for the current file upload question.
export function redirectToFileUploaderQuestion(req: Request) {
	const planPath = req.params.planReference ? `/${req.params.planReference}` : '';
	// Any questions that need to route to new subjourneys can be defined here
	if (req.params.question == 'gateway-2-report') {
		return `${req.baseUrl}${planPath}/gateway-2/${req.params.section}/${req.params.question}`;
	}
	if (req.params.question == 'signed-sla') {
		return `${req.baseUrl}${planPath}/gateway-1/${req.params.section}/${req.params.question}`;
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
