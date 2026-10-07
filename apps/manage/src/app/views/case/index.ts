import {
	addCaseNavigation,
	buildGetJourneyMiddleware,
	updateCaseField,
	getDeleteCase,
	getDeleteWorkshop,
	postDeleteWorkshop,
	getDeleteHearing,
	postDeleteHearing,
	postMarkAsDeleteCase,
	type UploadDocumentRequest,
	fileUploadQuestionConfigs,
	type FileUploadQuestion,
	getRouteQuestionUrl,
	fileUploaderCaseSessionKey,
	buildCheckReportMiddleware,
	buildRemoveDocumentConfirmMiddleware,
	downloadDocument,
	getParam,
	issueGateway2Report,
	issueExaminationReport,
	issueGateway1SLA,
	issueGateway3Document,
	redirectToFileUploaderQuestion,
	issueGateway2WorkshopDocuments,
	redirectToChecks,
	preprocessQuestionProperties,
	handleMulterFileSizeError,
	journeyFileUploadQuestionConfigs,
	issueMiqs
} from './controller.ts';
import { type SaveController } from './save/save-controller.ts';
import { Gateway1SaveController } from './save/gateway-1-save-controller.ts';
import { Gateway2SaveController } from './save/gateway-2-save-controller.ts';
import { Gateway3SaveController } from './save/gateway-3-save-controller.ts';
import { ExaminationSaveController } from './save/examination-save-controller.ts';
import { type IRouter, type Request, Router as createRouter, type RequestHandler } from 'express';
import type { ManageService } from '#service';
import * as authSession from '@planning-inspectorate/core/auth';
import {
	buildGetJourney,
	buildList,
	buildSave,
	question,
	validate,
	validationErrorHandler,
	type Journey,
	JourneyResponse,
	buildGetJourneyResponseFromSession,
	clearDataFromSession,
	saveDataToSession
} from '@planning-inspectorate/dynamic-forms';
import { questions, getQuestions } from './questions.ts';
import {
	createOverviewJourney,
	createGateway1Journey,
	createGateway2Journey,
	createGateway2WorkshopJourney,
	createGateway3Journey,
	createExaminationJourney,
	createExaminationHearingJourney,
	createExaminationPauseJourney,
	createGateway3ReportJourney,
	createTimetableJourney,
	createDeleteCaseJourney
} from './journey.ts';
import multer from 'multer';
import {
	createFileUploaderDeleteController,
	createFileUploaderUploadController,
	fileUploaderQuestionMiddleware,
	type UploadedFile
} from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import { DocumentUtil } from '@pins/local-plans-lib/util/documents.ts';
import lusca from 'lusca';
import { COMMON_CONSTS, questionPrefix } from '../../classes/common-consts.ts';
import { asyncHandler } from '@planning-inspectorate/core/util';
import type { Response, NextFunction } from 'express';
import { loadLpaOptions } from '../../util/options-helper.ts';
import {
	saveLastQuestionUrl,
	setBackLinkFromSession,
	setAsEditingFromCya,
	shouldReturnToCya
} from '../create-a-case/index.ts';
import { OverviewTabHandler } from './overview-data-handlers/overview-tab-handler.ts';
import { Gateway1TabHandler } from './overview-data-handlers/gateway-1-tab-handler.ts';
import { Gateway2TabHandler } from './overview-data-handlers/gateway-2-tab-handler.ts';
import { Gateway3TabHandler } from './overview-data-handlers/gateway-3-tab-handler.ts';
import { ExaminationTabHandler } from './overview-data-handlers/examination-tab-handler.ts';
import type { OverviewPageLoadHandler } from './overview-data-handlers/overview-page-load-handler.ts';
import { sortByDateColumn } from '#util/util.ts';
import { Gateway3SubmissionHandler } from './overview-data-handlers/gateway-3-submission-handler.ts';
import { ExaminationPauseHandler } from './overview-data-handlers/examination-pause-handler.ts';
import { createFileSubmitUploadController } from '@pins/local-plans-lib/forms/custom-components/file-uploader/upload-controller.ts';
import { pushAlertToSession } from '../../util/alert.ts';
import { TimetableSaveController } from './save/timetable-save-controller.ts';
import { TimetableTabHandler } from './overview-data-handlers/timetable-tab-handler.ts';

type JourneyFactory = (req: Request, response: JourneyResponse, questions: Record<string, any>) => Journey;

const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: Math.max(...fileUploadQuestionConfigs.map((questionConfig) => questionConfig.maxFileSizeBytes))
	}
});

interface CaseJourneyConfig {
	path: string;
	journeyId: string;
	createJourney: JourneyFactory;
	pageLoadHandler: new () => OverviewPageLoadHandler;
	supportsManageList?: boolean;
	supportsFileUpload?: boolean;
	redirectToTaskListOnSuccess?: boolean;
	saveController?: new (...args: any[]) => SaveController;
}

function registerGateway2WorkshopJourney(
	router: IRouter,
	service: ManageService,
	config: CaseJourneyConfig,
	updateCase: ReturnType<typeof updateCaseField>
): void {
	const { createJourney } = config;

	const buildLpaOptions = asyncHandler(async (_req: Request, _res: Response, next: NextFunction) => {
		const loaded = await loadLpaOptions(service);

		if (loaded.length > 0) {
			questions.lpa.options = [{ value: '', text: '' }, ...loaded];
		}

		next();
	});

	const getWorkshopJourneyResponse = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
		const reference = getParam(req.params.reference);

		const caseRecord = await service.db.case.findUnique({
			where: { reference },
			select: {
				id: true,
				planTitle: true
			}
		});

		if (!caseRecord) {
			return res.status(404).render('views/errors/404.njk');
		}

		const gateway2Data = await service.db.gateway2Info.findUnique({
			where: {
				caseId: caseRecord.id
			},
			include: {
				workshops: true
			}
		});

		res.locals.planTitle = caseRecord.planTitle;
		res.locals.reference = reference;

		const journeyResponse = new JourneyResponse(COMMON_CONSTS.GATEWAY_2_WORKSHOP_JOURNEY_ID, '', gateway2Data);

		res.locals.journeyResponse = journeyResponse;
		if (!res.locals.backLink) {
			res.locals.backLink = req.baseUrl + '/gateway-2';
		}

		next();
	});

	const completeWorkshop = asyncHandler(async (req: Request, res: Response) => {
		const reference = getParam(req.params.reference);

		const account = authSession.getAccount(req.session);
		const currentUser = account?.name ?? 'Unknown';
		//const workshopId = String(req.url).split('-')[-1];
		//reqCopy.params.question = `check-your-answers-${workshopId}`;
		await new Gateway2SaveController(service, req, reference).prepareAndSave({});
		await updateCaseField(service);

		await service.db.case.update({
			where: { reference },
			data: {
				caseHistories: {
					create: {
						event: 'Workshop set up',
						username: currentUser
					}
				}
			}
		});
		pushAlertToSession(req, 'success', 'Workshop set up');
		if (req.session.lastQuestionUrl) {
			delete req.session.lastQuestionUrl;
		}
		if (req.session) {
			delete req.session.answers;
		}

		res.redirect(`/case/${encodeURIComponent(reference)}/gateway-2`);
	});

	const getJourney = buildGetJourney((req, journeyResponse) => createJourney(req, journeyResponse, questions));

	router.get(
		'/gateway-2/set-up-workshop/check-your-answers-*workshopId',
		buildLpaOptions,
		getWorkshopJourneyResponse,
		getJourney,
		setBackLinkFromSession,
		setAsEditingFromCya,
		buildList({ notificationPreviewTemplate: 'gateway-2-report' })
	);

	router.post(
		'/gateway-2/set-up-workshop/check-your-answers-*workshopId',
		buildLpaOptions,
		getWorkshopJourneyResponse,
		getJourney,
		saveLastQuestionUrl,
		completeWorkshop
	);
	router.get('/gateway-2/set-up-workshop/delete-*workshopId', getDeleteWorkshop());
	router.post('/gateway-2/set-up-workshop/delete-*workshopId', postDeleteWorkshop(service));

	router.get(
		'/gateway-2/set-up-workshop/:section/:question',
		buildLpaOptions,
		getWorkshopJourneyResponse,
		getJourney,
		setBackLinkFromSession,
		question
	);

	router.post(
		'/gateway-2/set-up-workshop/:section/:question',
		buildLpaOptions,
		getWorkshopJourneyResponse,
		getJourney,
		validate,
		validationErrorHandler,
		saveLastQuestionUrl,
		redirectAfterCyaEdit(updateCase)
	);
}

function registerExaminationHearingJourney(
	router: IRouter,
	service: ManageService,
	config: CaseJourneyConfig,
	updateCase: ReturnType<typeof updateCaseField>
): void {
	const { createJourney } = config;

	const buildLpaOptions = asyncHandler(async (_req: Request, _res: Response, next: NextFunction) => {
		const loaded = await loadLpaOptions(service);

		if (loaded.length > 0) {
			questions.lpa.options = [{ value: '', text: '' }, ...loaded];
		}

		next();
	});

	const getHearingJourneyResponse = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
		const reference = getParam(req.params.reference);

		const caseRecord = await service.db.case.findUnique({
			where: { reference },
			select: {
				id: true,
				planTitle: true
			}
		});

		if (!caseRecord) {
			return res.status(404).render('views/errors/404.njk');
		}

		const examinationData = await service.db.examinationInfo.findUnique({
			where: {
				caseId: caseRecord.id
			},
			include: {
				hearings: true
			}
		});

		res.locals.planTitle = caseRecord.planTitle;
		res.locals.reference = reference;

		const journeyResponse = new JourneyResponse(COMMON_CONSTS.EXAMINATION_HEARING_JOURNEY_ID, '', examinationData);

		res.locals.journeyResponse = journeyResponse;

		next();
	});

	const completeHearing = asyncHandler(async (req: Request, res: Response) => {
		const reference = getParam(req.params.reference);
		const hearingNumber = Number(getParam(req.params.hearingId));
		const hearing = sortByDateColumn(res.locals.journeyResponse.answers.hearings, 'createdDate')[hearingNumber - 1];

		const account = authSession.getAccount(req.session);
		const currentUser = account?.name ?? 'Unknown';
		await new ExaminationSaveController(service, req, reference).prepareAndSave({});
		await updateCaseField(service);

		await service.db.case.update({
			where: { reference },
			data: {
				caseHistories: {
					create: {
						event: `${hearing.hearingLocationType} hearing set up`,
						username: currentUser
					}
				}
			}
		});
		pushAlertToSession(req, 'success', 'Hearing created');

		if (req.session.lastQuestionUrl) {
			delete req.session.lastQuestionUrl;
		}
		if (req.session) {
			delete req.session.answers;
		}

		res.redirect(`/case/${encodeURIComponent(reference)}/examination`);
	});

	const getJourney = buildGetJourney((req, journeyResponse) => createJourney(req, journeyResponse, questions));

	router.get(
		'/examination/set-up-hearing/check-your-answers-*hearingId',
		buildLpaOptions,
		getHearingJourneyResponse,
		getJourney,
		setBackLinkFromSession,
		setAsEditingFromCya,
		buildList({ notificationPreviewTemplate: 'gateway-2-report' })
	);

	router.post(
		'/examination/set-up-hearing/check-your-answers-*hearingId',
		buildLpaOptions,
		getHearingJourneyResponse,
		getJourney,
		saveLastQuestionUrl,
		completeHearing
	);

	router.get('/examination/set-up-hearing/delete-*hearingId', getDeleteHearing());
	router.post('/examination/set-up-hearing/delete-*hearingId', postDeleteHearing(service));

	router.get(
		'/examination/set-up-hearing/:section/:question',
		buildLpaOptions,
		getHearingJourneyResponse,
		getJourney,
		setBackLinkFromSession,
		question
	);

	router.post(
		'/examination/set-up-hearing/:section/:question',
		buildLpaOptions,
		getHearingJourneyResponse,
		getJourney,
		validate,
		validationErrorHandler,
		saveLastQuestionUrl,
		redirectAfterCyaEdit(updateCase)
	);
}

function redirectAfterCyaEdit(updateCase: any) {
	return (req: any, res: Response, next: NextFunction) => {
		let returnToCya = shouldReturnToCya(req, req.session.editingFromCheckAnswers === true);
		if (req.params.question) {
			if (
				req.params.question.startsWith('examination-hearing-duration-') ||
				req.params.question.startsWith('examination-hearing-end-date-')
			) {
				returnToCya = false;
				res.locals.redirectToExamination = true;
			} else {
				if (req.params.question.startsWith('examination-hearing-location-type-') && returnToCya == true) {
					returnToCya = false;
					req.session.editingFromCheckAnswers = false;
				}
			}
			const answer = Object.values(req.body).find((value) => value === 'yes' || value === 'no');
			if (req.session.returnToCyaAfterAnswer == true) {
				//returns to CYA after answering instead of going back though flow
				req.session.returnToCyaAfterAnswer = false;
				returnToCya = true;
				req.session.editingFromCheckAnswers = true;
			} else {
				if (questionPrefix.some((q) => req.params.question.startsWith(q)) && returnToCya === true) {
					if (answer == 'yes') {
						// known question (e.g. examinationHearingRemoteMeetingLinkKnown) that needs answering
						returnToCya = false;
						req.session.editingFromCheckAnswers = false;
						req.session.returnToCyaAfterAnswer = true;
					} else if (answer == 'no') {
						// known question (e.g. examinationHearingRemoteMeetingLinkKnown) that does not need answering
						returnToCya = true;
						req.session.editingFromCheckAnswers = true;
					} else {
						// type question (e.g. examinationHearingLocationType)
						returnToCya = false;
						req.session.editingFromCheckAnswers = false;
					}
				}
			}
		}
		buildSave(updateCase, returnToCya)(req, res, next);
	};
}

/** To add a new route, add a new object here **/
const CASE_JOURNEYS: CaseJourneyConfig[] = [
	{
		path: COMMON_CONSTS.OVERVIEW,
		journeyId: COMMON_CONSTS.OVERVIEW_JOURNEY_ID,
		createJourney: createOverviewJourney,
		pageLoadHandler: OverviewTabHandler,
		supportsManageList: true,
		supportsFileUpload: false,
		redirectToTaskListOnSuccess: true,
		saveController: undefined
	},
	{
		path: COMMON_CONSTS.GATEWAY_1_JOURNEY_ID,
		journeyId: COMMON_CONSTS.GATEWAY_1_JOURNEY_ID,
		createJourney: createGateway1Journey,
		pageLoadHandler: Gateway1TabHandler,
		supportsManageList: true,
		supportsFileUpload: true,
		redirectToTaskListOnSuccess: true,
		saveController: Gateway1SaveController
	},
	{
		path: COMMON_CONSTS.GATEWAY_2_JOURNEY_ID,
		journeyId: COMMON_CONSTS.GATEWAY_2_JOURNEY_ID,
		createJourney: createGateway2Journey,
		pageLoadHandler: Gateway2TabHandler,
		supportsManageList: true,
		supportsFileUpload: true,
		redirectToTaskListOnSuccess: true,
		saveController: Gateway2SaveController
	},
	{
		path: 'gateway-2/set-up-workshop',
		journeyId: COMMON_CONSTS.GATEWAY_2_WORKSHOP_JOURNEY_ID,
		createJourney: createGateway2WorkshopJourney,
		pageLoadHandler: Gateway2TabHandler,
		supportsManageList: false,
		supportsFileUpload: false,
		redirectToTaskListOnSuccess: true,
		saveController: Gateway2SaveController
	},
	{
		path: COMMON_CONSTS.GATEWAY_3_JOURNEY_ID,
		journeyId: COMMON_CONSTS.GATEWAY_3_JOURNEY_ID,
		createJourney: createGateway3Journey,
		pageLoadHandler: Gateway3TabHandler,
		supportsFileUpload: true,
		redirectToTaskListOnSuccess: true,
		saveController: Gateway3SaveController
	},
	{
		path: 'gateway-3-report',
		journeyId: COMMON_CONSTS.GATEWAY_3_REPORT_JOURNEY_ID,
		createJourney: createGateway3ReportJourney,
		pageLoadHandler: Gateway3SubmissionHandler,
		supportsFileUpload: true,
		redirectToTaskListOnSuccess: true,
		saveController: Gateway3SaveController
	},
	{
		path: COMMON_CONSTS.EXAMINATION_JOURNEY_ID,
		journeyId: COMMON_CONSTS.EXAMINATION_JOURNEY_ID,
		createJourney: createExaminationJourney,
		pageLoadHandler: ExaminationTabHandler,
		supportsManageList: true,
		supportsFileUpload: true,
		redirectToTaskListOnSuccess: true,
		saveController: ExaminationSaveController
	},
	{
		path: COMMON_CONSTS.EXAMINATION_PAUSE_JOURNEY_ID,
		journeyId: COMMON_CONSTS.EXAMINATION_PAUSE_JOURNEY_ID,
		createJourney: createExaminationPauseJourney,
		pageLoadHandler: ExaminationPauseHandler,
		supportsManageList: false,
		supportsFileUpload: false,
		redirectToTaskListOnSuccess: false,
		saveController: ExaminationSaveController
	},
	{
		path: 'examination/set-up-hearing',
		journeyId: COMMON_CONSTS.EXAMINATION_HEARING_JOURNEY_ID,
		createJourney: createExaminationHearingJourney,
		pageLoadHandler: ExaminationTabHandler,
		supportsManageList: true,
		supportsFileUpload: false,
		saveController: ExaminationSaveController
	},
	{
		path: 'examination/set-up-hearing',
		journeyId: COMMON_CONSTS.EXAMINATION_HEARING_JOURNEY_ID,
		createJourney: createExaminationHearingJourney,
		pageLoadHandler: ExaminationTabHandler,
		supportsManageList: true,
		supportsFileUpload: false,
		saveController: ExaminationSaveController
	},
	{
		path: COMMON_CONSTS.TIMETABLE_JOURNEY_ID,
		journeyId: COMMON_CONSTS.TIMETABLE_JOURNEY_ID,
		createJourney: createTimetableJourney,
		pageLoadHandler: TimetableTabHandler,
		redirectToTaskListOnSuccess: true,
		saveController: TimetableSaveController
	}
];

const CASE_JOURNEY_MAP = Object.fromEntries(CASE_JOURNEYS.map((elem) => [elem.path, elem.saveController]));

export function caseRouter(service: ManageService): IRouter {
	const router = createRouter({ mergeParams: true });
	const updateCase = updateCaseField(service);

	router.use(addCaseNavigation());

	const workshopConfig = CASE_JOURNEYS.find(
		(config) => config.journeyId === COMMON_CONSTS.GATEWAY_2_WORKSHOP_JOURNEY_ID
	);

	if (workshopConfig) {
		registerGateway2WorkshopJourney(router, service, workshopConfig, updateCase);
	}

	const hearingConfig = CASE_JOURNEYS.find(
		(config) => config.journeyId === COMMON_CONSTS.EXAMINATION_HEARING_JOURNEY_ID
	);
	if (hearingConfig) {
		registerExaminationHearingJourney(router, service, hearingConfig, updateCase);
	}

	for (const config of CASE_JOURNEYS) {
		if (
			config.journeyId === COMMON_CONSTS.GATEWAY_2_WORKSHOP_JOURNEY_ID ||
			config.journeyId === COMMON_CONSTS.EXAMINATION_HEARING_JOURNEY_ID
		) {
			continue;
		}

		registerCaseJourney(router, service, config, updateCase);
	}

	registerDeleteCaseJourney(router, service);

	router.get('/download-case-document/:documentId', downloadDocument(service));

	return router;
}

function registerCaseJourney(
	router: IRouter,
	service: ManageService,
	config: CaseJourneyConfig,
	updateCase: ReturnType<typeof updateCaseField>
): void {
	const {
		path,
		journeyId,
		createJourney,
		pageLoadHandler,
		supportsManageList,
		supportsFileUpload,
		redirectToTaskListOnSuccess
	} = config;

	const resolveQuestions = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
		await getQuestions(service, req);
		next();
	});
	const getJourney = buildGetJourney((req, journeyResponse) => createJourney(req, journeyResponse, questions));
	const getJourneyResponse = buildGetJourneyMiddleware(service, journeyId, pageLoadHandler);

	const fileUploadMiddleware = fileUploaderQuestionMiddleware({
		questionUrls: (journeyFileUploadQuestionConfigs[journeyId] ?? []).map((elem) => elem.url),
		sessionKey: fileUploaderCaseSessionKey
	});

	const questionPath = supportsManageList
		? `/${path}/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}`
		: `/${path}/:section/:question`;

	// List view
	router.get(
		`/${path}`,
		getJourneyResponse,
		preprocessQuestionProperties(service, journeyId, questions),
		resolveQuestions,
		getJourney,
		fileUploadMiddleware,
		buildList()
	);

	// Single question view
	router.get(
		questionPath,
		getJourneyResponse,
		preprocessQuestionProperties(service, journeyId, questions),
		resolveQuestions,
		getJourney,
		fileUploadMiddleware,
		question
	);

	// Check answers for question
	router.get(
		`/${path}/:section/:question/check`,
		getJourneyResponse,
		buildCheckReportMiddleware(service, journeyId),
		question
	);

	router.post(`/${path}/report/:question/check`, issueGateway2Report(service, journeyId));
	router.post(`/${path}/workshop/:question/check`, issueGateway2WorkshopDocuments(service, journeyId));
	router.post(`/${path}/hearings/:question/check`, issueMiqs(service, journeyId));
	router.post(`/${path}/gateway-1/:question/check`, issueGateway1SLA(service, journeyId));
	router.post(`/${path}/outcome/:question/check`, issueExaminationReport(service, journeyId));
	router.post(`/${path}/report/:question/check`, issueGateway2Report(service, journeyId));
	router.post(`/${path}/gateway-3-submission-*submissionId/:question/check`, issueGateway3Document(service));

	// Save answer
	router.post(
		questionPath,
		getJourneyResponse,
		resolveQuestions,
		getJourney,
		validate,
		validationErrorHandler,
		(req, res, next) => {
			// Until a report is issued, saving the plan outcome continues to the file uploader.
			const answers = res.locals.journeyResponse?.answers;
			const isPlanOutcome =
				journeyId === COMMON_CONSTS.EXAMINATION_JOURNEY_ID &&
				req.params.section === 'outcome' &&
				req.params.question === questions.isSound.url;
			const isCheckPageEdit =
				journeyId === COMMON_CONSTS.EXAMINATION_JOURNEY_ID &&
				req.params.section === 'outcome' &&
				[questions.isSound.url, questions.soundUnsoundDate.url].includes(String(req.params.question));
			if (isCheckPageEdit && req.query.returnTo === 'check') {
				res.locals.journey.taskListUrl = `${req.baseUrl}/${path}/outcome/${questions.examinationReport.url}/check?returnTo=check`;
			}
			const continueToReportUpload = isPlanOutcome && req.query.returnTo !== 'check' && !answers?.soundUnsoundDate;
			buildSave(updateCase, redirectToTaskListOnSuccess && !continueToReportUpload)(req, res, next);
		}
	);
	if (supportsFileUpload) {
		const fileUploaderStorage = () => service.createFileStorage(journeyId);
		const uploadDocumentRoute = buildFileUploadRouteHandler(
			new Map(
				fileUploadQuestionConfigs.map((questionConfig) => [
					questionConfig.url,
					createFileUploaderUploadController({
						fieldName: questionConfig.fieldName,
						question: questionConfig,
						storage: fileUploaderStorage,
						sessionKey: fileUploaderCaseSessionKey,
						destination: (req) => {
							const request = req as UploadDocumentRequest;
							const caseReference = getRoutePlanReference(req);
							return {
								folderPath: `${request.currentCase?.id ?? caseReference}/${questionConfig.url}`,
								metadata: {
									journeyId: journeyId,
									caseId: request.currentCase?.id,
									caseReference,
									fieldName: questionConfig.fieldName,
									documentSetFolderName: questionConfig.url
								}
							};
						},
						onFilesChange: async ({ req, uploadedFiles }) => {
							const existingDocuments = await DocumentUtil.findExistingDocuments({
								service,
								documentSetFolderName: questionConfig.url,
								request: req
							});
							await DocumentUtil.saveDocumentsOverride({
								service,
								request: req,
								documentSetFolderName: questionConfig.url,
								temporaryUploadedFiles: uploadedFiles,
								existingDocuments,
								isTemp: true
							});
							syncUploadAnswer(journeyId, req, questionConfig.fieldName, uploadedFiles);
							logFileUploaded(service, req, questionConfig, uploadedFiles);
							// Call update functions directly because updateCaseField causes the dynamic forms to consume the request
							const saveController = CASE_JOURNEY_MAP[journeyId];
							if (saveController) {
								//reqCopy.params.question = questionConfig.url;
								await new saveController(service, req, getParam(req.params.reference)).prepareAndSave({});
							}
						},
						onUploadError: ({ req, errors, error }) => logUploadFailed(service, req, questionConfig, { errors, error }),
						onUploadCleanupError: ({ req, file, error }) =>
							logUploadCleanupFailed(service, req, questionConfig, file, error),
						redirect: redirectToFileUploaderQuestion
					})
				])
			)
		);
		const deleteDocumentRoute = buildFileUploadRouteHandler(
			new Map(
				fileUploadQuestionConfigs.map((questionConfig) => [
					questionConfig.url,
					createFileUploaderDeleteController({
						fieldName: questionConfig.fieldName,
						question: questionConfig,
						storage: fileUploaderStorage,
						sessionKey: fileUploaderCaseSessionKey,
						onFilesChange: async ({ req, uploadedFiles, fileId }) => {
							const existingDocuments = await DocumentUtil.findExistingDocuments({
								service,
								request: req,
								documentSetFolderName: questionConfig.url
							});
							await DocumentUtil.deleteDocuments({
								service,
								temporaryUploadedFiles: uploadedFiles,
								fileId,
								existingDocuments
							});
							syncUploadAnswer(journeyId, req, questionConfig.fieldName, uploadedFiles);
							logDocumentDeleted(service, req, questionConfig, uploadedFiles);
							if (questionConfig.url === COMMON_CONSTS.EXAMINATION_REPORT_QUESTION) {
								pushAlertToSession(req, 'success', 'Document removed');
							}
							const caseId = (req as UploadDocumentRequest).currentCase?.id;
							if (
								caseId &&
								uploadedFiles.length === 0 &&
								questionConfig.url === COMMON_CONSTS.EXAMINATION_REPORT_QUESTION
							) {
								if (req.body?.returnToManage === 'true') {
									delete req.session.examinationReportReturnToManage;
								}
								await service.db.examinationInfo.updateMany({
									where: { caseId },
									data: {
										isSound: null,
										soundUnsoundDate: null,
										adoptionDate: null,
										approvedForCILDate: null
									}
								});
							}
						},
						onDeleteError: ({ req, fileId, error }) =>
							logDocumentDeleteFailed(service, req, questionConfig, fileId, error),
						redirect: redirectToFileUploaderQuestion
					})
				])
			)
		);

		const onSubmitDocumentRoute = buildFileUploadRouteHandler(
			new Map(
				fileUploadQuestionConfigs.map((questionConfig) => [
					questionConfig.url,
					createFileSubmitUploadController({
						fieldName: questionConfig.fieldName,
						question: questionConfig,
						storage: fileUploaderStorage,
						sessionKey: fileUploaderCaseSessionKey,
						onSubmit: async ({ req, uploadedFiles }) => {
							await DocumentUtil.updateTemporaryDocumentToPermanent(service, uploadedFiles);
							const existingDocuments = await DocumentUtil.findExistingDocuments({
								service,
								documentSetFolderName: questionConfig.url,
								request: req
							});
							await DocumentUtil.restoreDocuments({
								service,
								temporaryUploadedFiles: uploadedFiles,
								existingDocuments
							});
							await DocumentUtil.deleteDocuments({
								service,
								temporaryUploadedFiles: uploadedFiles,
								existingDocuments
							});
						},
						redirect: (req, options) => redirectToChecks(req, path, options)
					})
				])
			)
		);

		router.get(
			`/${path}/:section/:question/remove/:fileId`,
			getJourneyResponse,
			buildRemoveDocumentConfirmMiddleware(journeyId)
		);
		router.post(
			`${questionPath}/upload-documents`,
			getJourneyResponse,
			getJourney,
			upload.array('files[]'),
			// Lusca CSRF check performed after Multer handles the multipart/form-data
			lusca.csrf(),
			uploadDocumentRoute,
			handleMulterFileSizeError
		);

		router.post(
			`${questionPath}/upload-documents/submit`,
			getJourneyResponse,
			getJourney,
			upload.array('files[]'),
			// Lusca CSRF check performed after Multer handles the multipart/form-data
			lusca.csrf(),
			onSubmitDocumentRoute,
			handleMulterFileSizeError
		);

		router.post(
			`${questionPath}/delete-document/*fileId`,
			getJourneyResponse,
			deleteDocumentRoute,
			handleMulterFileSizeError
		);
	}
}

/**
 * Create a route handler
 * @param handlersByQuestionUrl A map of question to the underlying handler object
 * @returns The result of the request handler
 */
function buildFileUploadRouteHandler(handlersByQuestionUrl: Map<string, RequestHandler>): RequestHandler {
	return (req, res, next) => {
		const questionUrl = getRouteQuestionUrl(req);
		const handler = questionUrl ? handlersByQuestionUrl.get(questionUrl) : undefined;
		if (!handler || typeof handler !== 'function') {
			return res.status(404).render('views/errors/404.njk');
		}

		return handler(req, res, next);
	};
}

/**
 * Keeps a file upload answer in sync with uploaded files.
 * @param journeyId The id of the journey
 * @param req The request that holds the session details
 * @param fieldName The field that the uploaded file belongs to
 * @param uploadedFiles An array of uploaded files
 */
export function syncUploadAnswer(journeyId: string, req: Request, fieldName: string, uploadedFiles: UploadedFile[]) {
	if (!req.session) {
		return;
	}

	const request = req as UploadDocumentRequest;
	const planReference = getRoutePlanReference(req);
	const forms = (request.session.forms ??= {});

	const answers = planReference
		? getOrCreateRecord(getOrCreateRecord(forms, planReference), journeyId)
		: getOrCreateRecord(forms, journeyId);

	if (uploadedFiles.length > 0) {
		answers[fieldName] = uploadedFiles;
		return;
	}

	delete answers[fieldName];
}

function logFileUploaded(
	service: ManageService,
	req: Request,
	questionConfig: FileUploadQuestion,
	uploadedFiles: UploadedFile[]
) {
	service.logger.info(
		{
			...uploadLogContext(req, questionConfig),
			fileCount: uploadedFiles.length
		},
		'Document uploaded'
	);
}

function logUploadFailed(
	service: ManageService,
	req: Request,
	questionConfig: FileUploadQuestion,
	{ errors, error }: { errors?: Array<{ text: string; href: string }>; error?: unknown }
) {
	const context = {
		...uploadLogContext(req, questionConfig),
		errorCount: errors?.length ?? 0
	};

	if (error) {
		service.logger.error({ ...context, error }, 'Document upload failed');
		return;
	}

	service.logger.warn(context, 'Gateway 2 document upload failed');
}

function logUploadCleanupFailed(
	service: ManageService,
	req: Request,
	questionConfig: FileUploadQuestion,
	file: UploadedFile,
	error: unknown
) {
	service.logger.error(
		{
			...uploadLogContext(req, questionConfig),
			fileId: file.id,
			error
		},
		'Document upload cleanup failed'
	);
}

function getRoutePlanReference(req: Request): string | undefined {
	return getParam(req.params.reference) || undefined;
}

function uploadLogContext(req: Request, questionConfig: FileUploadQuestion) {
	const request = req as UploadDocumentRequest;
	return {
		planReference: getRoutePlanReference(req),
		caseId: request.currentCase?.id,
		fieldName: questionConfig.fieldName,
		questionUrl: questionConfig.url
	};
}

function logDocumentDeleted(
	service: ManageService,
	req: Request,
	questionConfig: FileUploadQuestion,
	uploadedFiles: UploadedFile[]
) {
	service.logger.info(
		{
			...uploadLogContext(req, questionConfig),
			fileId: req.params.fileId,
			remainingFileCount: uploadedFiles.length
		},
		'Document deleted'
	);
}

function logDocumentDeleteFailed(
	service: ManageService,
	req: Request,
	questionConfig: FileUploadQuestion,
	fileId: string,
	error: unknown
) {
	service.logger.error(
		{
			...uploadLogContext(req, questionConfig),
			fileId,
			error
		},
		'Document delete failed'
	);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
	return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function getOrCreateRecord(container: Record<string, unknown>, key: string): Record<string, unknown> {
	const existingValue = asRecord(container[key]);
	if (existingValue) {
		return existingValue;
	}

	const value: Record<string, unknown> = {};
	container[key] = value;
	return value;
}

function registerDeleteCaseJourney(router: IRouter, service: ManageService): void {
	const journeyId = COMMON_CONSTS.DELETE_CASE_JOURNEY_ID;
	const firstQuestionPath = `/delete-case/${COMMON_CONSTS.DELETE_CASE_REASON}`;

	const getJourneyResponse = buildGetJourneyResponseFromSession(journeyId);
	const resolveQuestions = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
		await getQuestions(service, req);
		next();
	});
	const getJourney = buildGetJourney((req, journeyResponse) =>
		createDeleteCaseJourney(req, journeyResponse, questions)
	);

	const setDeleteCaseSection = (req: Request, _res: Response, next: NextFunction) => {
		req.params.section = COMMON_CONSTS.DELETE_CASE_SECTION;
		next();
	};

	router.get('/delete-case', (req, res) => {
		clearDataFromSession({ req, journeyId });
		res.redirect(req.baseUrl + firstQuestionPath);
	});

	router.get(
		'/delete-case/check',
		getJourneyResponse,
		resolveQuestions,
		getJourney,
		getDeleteCase(service),
		buildList()
	);
	router.post('/delete-case/check', getJourneyResponse, resolveQuestions, getJourney, postMarkAsDeleteCase(service));

	router.get(
		'/delete-case/:question',
		setDeleteCaseSection,
		getJourneyResponse,
		resolveQuestions,
		getJourney,
		question
	);
	router.post(
		'/delete-case/:question',
		setDeleteCaseSection,
		getJourneyResponse,
		resolveQuestions,
		getJourney,
		validate,
		validationErrorHandler,
		buildSave(saveDataToSession, true)
	);
}
