import type { PortalService } from '#service';
import { type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import multer from 'multer';
import {
	createFileUploaderDeleteController,
	createFileUploaderUploadController,
	type FileUploaderQuestionProps,
	type FileUploaderSession,
	type UploadedFile
} from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import { asyncHandler } from '@planning-inspectorate/core/util';
import { DOCUMENT_SET_ID } from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';
import { GATEWAY_3_DECISION_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';
import { DocumentUtil } from '@pins/local-plans-lib/util/documents.ts';
import lusca from 'lusca';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ResubmissionSession = Request['session'] &
	FileUploaderSession & {
		forms?: Record<string, unknown>;
	};

type ResubmissionRequest = Request & {
	currentCase?: Record<string, unknown>;
	session: ResubmissionSession;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RESUBMISSION_VIEW_PATH = 'views/manage-local-plans/gateway-3-resubmission/resubmission.njk';
const UPLOAD_VIEW_PATH = 'forms/custom-components/file-uploader/index.njk';

const RESUBMISSION_DOCUMENTS_QUESTION: FileUploaderQuestionProps = {
	fieldName: 'resubmissionDocuments',
	title: 'New or updated documents',
	question: 'Upload any new or updated documents',
	description: 'Additional documents',
	url: 'additional-documents',
	type: 'file-uploader' as const,
	validators: [],
	editable: true,
	multiple: true,
	maxFileSizeBytes: 250 * 1024 * 1024,
	maxFileSizeLabel: '250MB',
	maxTotalUploadSizeBytes: 1024 * 1024 * 1024,
	allowedFileExtensions: [
		'pdf',
		'doc',
		'docx',
		'ppt',
		'pptx',
		'xls',
		'xlsx',
		'msg',
		'jpg',
		'jpeg',
		'png',
		'tif',
		'tiff'
	],
	allowedMimeTypes: [
		'application/pdf',
		'application/msword',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'application/vnd.ms-powerpoint',
		'application/vnd.openxmlformats-officedocument.presentationml.presentation',
		'application/vnd.ms-excel',
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		'application/vnd.ms-outlook',
		'image/jpeg',
		'image/png',
		'image/tiff'
	],
	text: {
		caption: 'Additional documents',
		fileRequirementsText:
			'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB. The total size of your uploaded files must be smaller than 1GB.',
		chooseFilesButtonText: 'Choose files',
		dropInstructionText: 'or drop files',
		continueButtonText: 'Save and return'
	}
};

const SUBMIT_ERROR = 'Add any new or updated documents before submitting';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRoutePlanReference(req: Request): string | undefined {
	const planReference = Array.isArray(req.params.planReference)
		? req.params.planReference[0]
		: req.params.planReference;
	return planReference || undefined;
}

function formatDisplayDate(date: Date | null | undefined) {
	if (!date) {
		return undefined;
	}
	return date.toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
}

function renderNotFound(res: Response) {
	return res.status(404).render('views/layouts/error', {
		pageTitle: 'Page not found',
		messages: [
			'If you typed the web address, check it is correct.',
			'If you pasted the web address, check you copied the entire address.'
		]
	});
}

function fileUploaderSessionKey(req: Request) {
	return `${req.params.planReference}:resubmissionDocuments`;
}

function getUploadedDocuments(req: Request): UploadedFile[] {
	const request = req as ResubmissionRequest;
	const sessionKey = fileUploaderSessionKey(req);
	return request.session.fileUploader?.[sessionKey]?.uploadedFiles ?? [];
}

/**
 * Derives the current submission number from the case's Gateway 3 submissions.
 * The submissions list is ordered by completionDate; the last entry is the
 * current (pending) resubmission.
 */
function getSubmissionNumber(req: Request): number {
	const request = req as ResubmissionRequest;
	const gateway3Info = request.currentCase?.gateway3Info as Record<string, unknown> | undefined;
	const submissions = (gateway3Info?.submissions ?? []) as unknown[];
	return submissions.length;
}

/**
 * Returns the document set folder name for the current submission.
 * Each submission uses its own indexed folder: `gateway-3-document-{N}`.
 */
function getResubmissionDocumentSetFolderName(req: Request): string {
	const submissionNumber = getSubmissionNumber(req);
	return `gateway-3-document-${submissionNumber}`;
}

// ---------------------------------------------------------------------------
// Case-loading middleware
// ---------------------------------------------------------------------------

export function buildLoadResubmissionCase(service: PortalService): RequestHandler {
	return async (req, res, next) => {
		const planReference = getRoutePlanReference(req);
		if (!planReference) {
			return renderNotFound(res);
		}

		const currentCase = await service.db.case.findUnique({
			where: { reference: planReference },
			include: {
				gateway3Info: {
					include: {
						submissions: {
							orderBy: { completionDate: 'asc' as const }
						}
					}
				},
				documents: {
					where: {
						isDeleted: false
					},
					select: {
						guid: true,
						name: true,
						documentSetId: true,
						createdAt: true,
						isDeleted: true,
						latestDocumentVersion: {
							select: {
								originalFilename: true,
								fileName: true,
								dateCreated: true,
								isDeleted: true
							}
						}
					}
				}
			}
		});

		if (!currentCase) {
			return renderNotFound(res);
		}

		const request = req as ResubmissionRequest;
		request.currentCase = currentCase as unknown as Record<string, unknown>;
		return next();
	};
}

// ---------------------------------------------------------------------------
// Guard: ensure the latest completed submission has decision = RESUBMISSION_REQUIRED
// ---------------------------------------------------------------------------

export function buildGuardResubmissionPage(): RequestHandler {
	return (req, res, next) => {
		const request = req as ResubmissionRequest;
		const currentCase = request.currentCase as Record<string, unknown> | undefined;
		const gateway3Info = currentCase?.gateway3Info as Record<string, unknown> | undefined;
		const submissions = (gateway3Info?.submissions ?? []) as { decision: string | null; completionDate: Date | null }[];
		const latestSubmission = submissions.at(-1);

		// The BO may pre-create an empty submission after issuing a resubmission decision.
		// Allow access when the latest completed (or only) submission has the resubmission decision.
		const hasResubmissionDecision =
			latestSubmission?.decision === GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED ||
			(submissions.length > 1 &&
				!latestSubmission?.completionDate &&
				!latestSubmission?.decision &&
				submissions.at(-2)?.decision === GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED);

		if (hasResubmissionDecision) {
			return next();
		}

		const planReference = getRoutePlanReference(req);
		const encodedPlanReference = planReference ? encodeURIComponent(planReference) : '';
		return res.redirect(`/manage-local-plans/${encodedPlanReference}`);
	};
}

// ---------------------------------------------------------------------------
// GET resubmission page
// ---------------------------------------------------------------------------

export function buildGetResubmissionPage(): RequestHandler {
	return (req, res) => {
		const request = req as ResubmissionRequest;
		const planReference = getRoutePlanReference(req);
		const encodedPlanReference = planReference ? encodeURIComponent(planReference) : '';
		const currentCase = request.currentCase as Record<string, unknown>;
		const gateway3Info = currentCase?.gateway3Info as Record<string, unknown> | undefined;
		const submissions = (gateway3Info?.submissions ?? []) as {
			completionDate: Date | null;
			decision: string | null;
		}[];
		const documents = (currentCase?.documents ?? []) as {
			guid: string;
			name: string;
			documentSetId: string;
			latestDocumentVersion: {
				originalFilename: string | null;
				fileName: string | null;
				dateCreated: Date | null;
			} | null;
		}[];

		// The current submission we are collecting new documents for
		const latestSubmission = submissions.at(-1);
		const latestIsCurrentResubmissionPlaceholder = Boolean(
			latestSubmission && !latestSubmission.completionDate && !latestSubmission.decision
		);

		const completedSubmissions = latestIsCurrentResubmissionPlaceholder ? submissions.slice(0, -1) : submissions;
		const submissionNumber = latestIsCurrentResubmissionPlaceholder ? submissions.length : submissions.length + 1;
		const previousSubmissionNumber = completedSubmissions.length;
		const previousSubmissionDocumentSetId =
			previousSubmissionNumber > 0 ? DOCUMENT_SET_ID[`G3_DOCUMENT_${previousSubmissionNumber}`] : undefined;

		const g3ReportDoc = previousSubmissionDocumentSetId
			? documents.find((d) => d.documentSetId === previousSubmissionDocumentSetId)
			: null;

		// Build report document view data
		const reportDocument = g3ReportDoc
			? {
					fileName:
						g3ReportDoc.latestDocumentVersion?.originalFilename ??
						g3ReportDoc.latestDocumentVersion?.fileName ??
						g3ReportDoc.name,
					downloadUrl: `/manage-local-plans/${encodedPlanReference}/gateway-3-resubmission/download-document/${g3ReportDoc.guid}`,
					dateIssued: formatDisplayDate(g3ReportDoc.latestDocumentVersion?.dateCreated)
				}
			: null;

		const previousSubmissions = completedSubmissions.map((sub, index) => ({
			number: index + 1,
			submittedDate: formatDisplayDate(sub.completionDate)
		}));

		// Get uploaded resubmission documents from session
		const uploadedFiles = getUploadedDocuments(req);
		const uploadedDocuments = uploadedFiles.map((file) => ({
			fileName: file.fileName,
			downloadUrl: `/manage-local-plans/${encodedPlanReference}/gateway-3-resubmission/download-document/${file.id}`
		}));

		return res.render(RESUBMISSION_VIEW_PATH, {
			pageCaption: currentCase?.planTitle,
			submissionNumber,
			reportDocument,
			previousSubmissions,
			uploadedDocuments,
			addDocumentsUrl: `/manage-local-plans/${encodedPlanReference}/gateway-3-resubmission/additional-documents`,
			saveAndComeBackUrl: `/manage-local-plans/${encodedPlanReference}`,
			backLinkUrl: `/manage-local-plans/${encodedPlanReference}`,
			errorSummary: res.locals.errorSummary
		});
	};
}

// ---------------------------------------------------------------------------
// POST resubmission (submit) — validates documents then redirects to declaration
// ---------------------------------------------------------------------------

export function buildPostResubmission(): RequestHandler {
	return (req, res) => {
		const planReference = getRoutePlanReference(req);
		const encodedPlanReference = planReference ? encodeURIComponent(planReference) : '';
		const uploadedFiles = getUploadedDocuments(req);

		if (uploadedFiles.length === 0) {
			res.status(400);
			res.locals.errorSummary = [
				{
					text: SUBMIT_ERROR,
					href: '#new-documents-heading'
				}
			];
			return buildGetResubmissionPage()(req, res, () => {});
		}

		return res.redirect(`/manage-local-plans/${encodedPlanReference}/gateway-3-submission/declaration`);
	};
}

// ---------------------------------------------------------------------------
// GET upload documents page
// ---------------------------------------------------------------------------

export function buildGetUploadDocumentsPage(): RequestHandler {
	return (req, res) => {
		const planReference = getRoutePlanReference(req);
		const encodedPlanReference = planReference ? encodeURIComponent(planReference) : '';
		const uploadedFiles = getUploadedDocuments(req);

		// Consume any session errors left by the upload controller so they
		// only display once and are not shown on a fresh page load.
		const sessionErrors = (req.session as Record<string, unknown>).errors;
		const sessionErrorSummary = (req.session as Record<string, unknown>).errorSummary;
		delete (req.session as Record<string, unknown>).errors;
		delete (req.session as Record<string, unknown>).errorSummary;

		// Only pass errors/errorSummary when they contain real data —
		// Nunjucks treats empty arrays/objects as truthy.
		const hasErrors = sessionErrors && Object.keys(sessionErrors as object).length > 0;
		const hasErrorSummary = Array.isArray(sessionErrorSummary) && sessionErrorSummary.length > 0;

		return res.render(UPLOAD_VIEW_PATH, {
			layoutTemplate: 'views/layouts/main.njk',
			question: RESUBMISSION_DOCUMENTS_QUESTION,
			backLink: `/manage-local-plans/${encodedPlanReference}/gateway-3-resubmission`,
			currentUrl: `/manage-local-plans/${encodedPlanReference}/gateway-3-resubmission/additional-documents`,
			uploadedFiles,
			uploadedFilesEncoded: Buffer.from(JSON.stringify(uploadedFiles), 'utf-8').toString('base64'),
			errors: hasErrors ? sessionErrors : null,
			errorSummary: hasErrorSummary ? sessionErrorSummary : null
		});
	};
}

export function buildPostUploadDocumentsPage(): RequestHandler {
	return (req, res) => {
		const planReference = getRoutePlanReference(req);
		const encodedPlanReference = planReference ? encodeURIComponent(planReference) : '';
		return res.redirect(`/manage-local-plans/${encodedPlanReference}/gateway-3-resubmission`);
	};
}

// ---------------------------------------------------------------------------
// Multer & file upload handlers
// ---------------------------------------------------------------------------

const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: RESUBMISSION_DOCUMENTS_QUESTION.maxFileSizeBytes
	}
});

export function handleMulterFileSizeError(err: Error, req: Request, res: Response, next: NextFunction) {
	if (err && 'code' in err && (err as { code: string }).code === 'LIMIT_FILE_SIZE') {
		const planReference = getRoutePlanReference(req);
		const encodedPlanReference = planReference ? encodeURIComponent(planReference) : '';
		return res.redirect(
			`/manage-local-plans/${encodedPlanReference}/gateway-3-resubmission/additional-documents?error=fileSize`
		);
	}
	return next(err);
}

// ---------------------------------------------------------------------------
// Build all route middleware
// ---------------------------------------------------------------------------

export function buildGateway3ResubmissionMiddleware(service: PortalService) {
	const loadCase = asyncHandler(buildLoadResubmissionCase(service));
	const guardResubmission = buildGuardResubmissionPage();
	const getResubmissionPage = buildGetResubmissionPage();
	const postResubmission = buildPostResubmission();
	const getUploadPage = buildGetUploadDocumentsPage();
	const postUploadPage = buildPostUploadDocumentsPage();

	const fileUploaderStorage = () => service.createFileStorage('gateway3-resubmission');

	const uploadRedirect = (req: Request) => {
		const ref = getRoutePlanReference(req);
		const encoded = ref ? encodeURIComponent(ref) : '';
		return `/manage-local-plans/${encoded}/gateway-3-resubmission/additional-documents`;
	};

	const uploadDocuments = createFileUploaderUploadController({
		fieldName: RESUBMISSION_DOCUMENTS_QUESTION.fieldName,
		question: RESUBMISSION_DOCUMENTS_QUESTION,
		storage: fileUploaderStorage,
		sessionKey: fileUploaderSessionKey,
		redirect: uploadRedirect,
		destination: (req) => {
			const request = req as ResubmissionRequest;
			const caseId = (request.currentCase as Record<string, unknown>)?.id ?? req.params.planReference;
			const folderName = getResubmissionDocumentSetFolderName(req);
			return {
				folderPath: `${caseId}/${folderName}`,
				metadata: {
					journeyId: 'gateway3-resubmission',
					caseId,
					caseReference: req.params.planReference,
					fieldName: RESUBMISSION_DOCUMENTS_QUESTION.fieldName,
					documentSetFolderName: folderName
				}
			};
		},
		onFilesChange: async ({ req, uploadedFiles }) => {
			const folderName = getResubmissionDocumentSetFolderName(req);
			await DocumentUtil.saveDocuments(service, req, folderName, uploadedFiles);
		}
	});

	const deleteDocument = createFileUploaderDeleteController({
		fieldName: RESUBMISSION_DOCUMENTS_QUESTION.fieldName,
		question: RESUBMISSION_DOCUMENTS_QUESTION,
		storage: fileUploaderStorage,
		sessionKey: fileUploaderSessionKey,
		redirect: uploadRedirect,
		onFilesChange: async ({ req, uploadedFiles }) => {
			const folderName = getResubmissionDocumentSetFolderName(req);
			await DocumentUtil.saveDocuments(service, req, folderName, uploadedFiles);
		}
	});

	return {
		loadCase,
		guardResubmission,
		getResubmissionPage,
		postResubmission,
		getUploadPage,
		postUploadPage,
		upload,
		uploadDocuments,
		deleteDocument,
		lusca: lusca
	};
}
