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
import { sortGateway3Submissions, type Gateway3SubmissionSummary } from '#util/gateway-3-submission.ts';

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
const PREVIOUS_SUBMISSION_VIEW_PATH = 'views/manage-local-plans/gateway-3-resubmission/previous-submission.njk';
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
		uploadLabel: 'Upload a file',
		fileRequirementsText:
			'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB. The total size of your uploaded files must be smaller than 1GB.',
		chooseFilesButtonText: 'Choose files',
		dropInstructionText: 'or drop files',
		continueButtonText: 'Save and return'
	}
};

const SUBMIT_ERROR = 'Add any new or updated documents before submitting';

/** Required GW3 documents shown on the initial submission detail page.
 *  `documentSetId` values match DOCUMENT_SET_ID from static-data. */
const REQUIRED_DOCUMENT_DEFS = [
	{
		title: 'Proposed local plan intended for submission for examination',
		documentSetId: DOCUMENT_SET_ID.G3_PROPOSED_LOCAL_PLAN
	},
	{ title: 'Map of proposed local plan policies', documentSetId: DOCUMENT_SET_ID.G3_MAP_OF_POLICIES },
	{ title: 'Statement of Compliance', documentSetId: DOCUMENT_SET_ID.G3_STATEMENT_OF_COMPLIANCE },
	{ title: 'Statement of Soundness', documentSetId: DOCUMENT_SET_ID.G3_STATEMENT_OF_SOUNDNESS },
	{
		title: 'Summary of consultation and engagement activities undertaken in preparing the proposed local plan',
		documentSetId: DOCUMENT_SET_ID.G3_CONSULTATION_ENGAGEMENT_SUMMARY
	},
	{ title: 'Summary of scoping consultation', documentSetId: DOCUMENT_SET_ID.G3_SCOPING_CONSULTATION_SUMMARY },
	{
		title: 'Summary of consultation on proposed local plan content and evidence',
		documentSetId: DOCUMENT_SET_ID.G3_CONSULTATION_CONTENT_EVIDENCE_SUMMARY
	},
	{
		title: 'Summary of consultation on proposed local plan',
		documentSetId: DOCUMENT_SET_ID.G3_CONSULTATION_PROPOSED_PLAN_SUMMARY
	},
	{
		title: 'Statement setting out practical arrangements demonstrating readiness for examination',
		documentSetId: DOCUMENT_SET_ID.G3_PRACTICAL_ARRANGEMENTS_STATEMENT
	}
];

/** Optional GW3 documents shown on the initial submission detail page. */
const OPTIONAL_DOCUMENT_DEFS = [
	{ title: 'Copies of representations', documentSetId: DOCUMENT_SET_ID.G3_COPIES_OF_REPRESENTATIONS },
	{ title: 'Supplementary plans statement', documentSetId: DOCUMENT_SET_ID.G3_SUPPLEMENTARY_PLANS_STATEMENT },
	{ title: 'Environmental report', documentSetId: DOCUMENT_SET_ID.G3_ENVIRONMENTAL_REPORT },
	{
		title:
			'Statement of reasons for a determination that the proposed local plan is unlikely to have significant environmental effects',
		documentSetId: DOCUMENT_SET_ID.G3_STATEMENT_OF_REASONS_DETERMINATION
	},
	{
		title:
			'Summary of representations relating to progress towards meeting prescribed requirements and the LPA response',
		documentSetId: DOCUMENT_SET_ID.G3_REPRESENTATIONS_PROGRESS_SUMMARY
	},
	{
		title: 'Summary of how Gateway 2 assessor issues have been addressed',
		documentSetId: DOCUMENT_SET_ID.G3_GATEWAY_2_ISSUES_SUMMARY
	},
	{
		title:
			'Statement explaining changes since the proposed local plan consultation, reasons for those changes, and any additional consultation',
		documentSetId: DOCUMENT_SET_ID.G3_CHANGES_SINCE_CONSULTATION_STATEMENT
	},
	{ title: 'Other documents', documentSetId: DOCUMENT_SET_ID.G3_OTHER_DOCUMENTS }
];

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

function formatDisplayTime(date: Date | null | undefined) {
	if (!date) {
		return undefined;
	}
	return date.toLocaleTimeString('en-GB', {
		hour: '2-digit',
		minute: '2-digit'
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
	const submissionNumber = getSubmissionNumber(req);
	return `${req.params.planReference}:resubmissionDocuments:${submissionNumber}`;
}

function getUploadedDocuments(req: Request): UploadedFile[] {
	const request = req as ResubmissionRequest;
	const sessionKey = fileUploaderSessionKey(req);
	return request.session.fileUploader?.[sessionKey]?.uploadedFiles ?? [];
}

/**
 * Derives the current submission number from the case's Gateway 3 submissions.
 * The submissions are sorted via sortGateway3Submissions so the pending
 * (null completionDate) placeholder is always last.
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
						submissions: true
					}
				},
				documents: {
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

		// Sort submissions so null completionDate (placeholder) is always last,
		// regardless of SQL Server NULL ordering.
		if (currentCase.gateway3Info?.submissions) {
			currentCase.gateway3Info.submissions = sortGateway3Submissions(
				currentCase.gateway3Info.submissions as unknown as Gateway3SubmissionSummary[]
			) as typeof currentCase.gateway3Info.submissions;
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
		const submissions = (gateway3Info?.submissions ?? []) as {
			decision: string | null;
			completionDate: Date | null;
			submittedDate: Date | null;
		}[];
		const latestSubmission = submissions.at(-1);

		// The BO may pre-create an empty submission after issuing a resubmission decision.
		// Allow access when the latest completed (or only) submission has the resubmission decision
		// AND the LPA has not already submitted (submittedDate is still null).
		const hasResubmissionDecision =
			latestSubmission?.decision === GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED ||
			(submissions.length > 1 &&
				!latestSubmission?.completionDate &&
				!latestSubmission?.submittedDate &&
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
			submittedDate: Date | null;
			decision: string | null;
		}[];
		const documents = (currentCase?.documents ?? []) as {
			guid: string;
			name: string;
			documentSetId: string;
			isDeleted: boolean;
			latestDocumentVersion: {
				originalFilename: string | null;
				fileName: string | null;
				dateCreated: Date | null;
			} | null;
		}[];

		// The current submission we are collecting new documents for
		const latestSubmission = submissions.at(-1);
		const latestIsCurrentResubmissionPlaceholder = Boolean(
			latestSubmission &&
			!latestSubmission.completionDate &&
			!latestSubmission.submittedDate &&
			!latestSubmission.decision
		);

		const completedSubmissions = latestIsCurrentResubmissionPlaceholder ? submissions.slice(0, -1) : submissions;
		const submissionNumber = latestIsCurrentResubmissionPlaceholder ? submissions.length : submissions.length + 1;

		// The report that triggered this resubmission comes from the previous
		// submission's document set (G3_DOCUMENT_{previousSubmissionNumber}).
		// This is the BO-issued report, not the FO-uploaded documents.
		const previousSubmissionNumber = completedSubmissions.length;
		const reportDocumentSetId =
			previousSubmissionNumber > 0 ? DOCUMENT_SET_ID[`G3_DOCUMENT_${previousSubmissionNumber}`] : undefined;
		const g3ReportDocs = reportDocumentSetId
			? documents.filter((d) => d.documentSetId === reportDocumentSetId && !d.isDeleted)
			: [];

		// Build report document view data (multiple documents possible)
		const reportDocuments = g3ReportDocs.map((doc) => ({
			fileName: doc.latestDocumentVersion?.originalFilename ?? doc.latestDocumentVersion?.fileName ?? doc.name,
			downloadUrl: `/manage-local-plans/${encodedPlanReference}/gateway-3-resubmission/download-document/${doc.guid}`,
			dateIssued: formatDisplayDate(doc.latestDocumentVersion?.dateCreated)
		}));
		const previousSubmissions = completedSubmissions.map((sub, index) => ({
			number: index + 1,
			submittedDate: formatDisplayDate(sub.submittedDate ?? sub.completionDate),
			url: `/manage-local-plans/${encodedPlanReference}/gateway-3-resubmission/submission/${index + 1}`
		}));

		// Get uploaded resubmission documents from session.
		// Session files may not carry a documentGuid in metadata (the blob
		// upload sets id = blobPath, not the DB guid). Fall back to matching
		// the session file.id against document.name in the loaded case
		// documents to resolve the correct DB guid for download links.
		const uploadedFiles = getUploadedDocuments(req);
		const uploadedDocuments = uploadedFiles.map((file) => {
			const documentGuid =
				(file.metadata as Record<string, unknown> | undefined)?.documentGuid ??
				documents.find((d) => d.name === file.id)?.guid;
			return {
				fileName: file.fileName,
				downloadUrl: documentGuid
					? `/manage-local-plans/${encodedPlanReference}/gateway-3-resubmission/download-document/${documentGuid}`
					: undefined
			};
		});

		// Last completed submission metadata for display
		const lastCompleted = completedSubmissions.at(-1);
		const previousSubmissionDate = formatDisplayDate(lastCompleted?.completionDate);
		const previousSubmitter = currentCase?.email;

		return res.render(RESUBMISSION_VIEW_PATH, {
			pageCaption: currentCase?.planTitle,
			submissionNumber,
			reportDocuments,
			previousSubmissions,
			uploadedDocuments,
			previousSubmissionDate,
			previousSubmitter,
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

		return res.redirect(`/manage-local-plans/${encodedPlanReference}/gateway-3-resubmission/declaration`);
	};
}

// ---------------------------------------------------------------------------
// GET declaration page
// ---------------------------------------------------------------------------

const DECLARATION_VIEW_PATH = 'views/manage-local-plans/gateway-3-resubmission/declaration.njk';

export function buildGetDeclarationPage(): RequestHandler {
	return (req, res) => {
		const planReference = getRoutePlanReference(req);
		const encodedPlanReference = planReference ? encodeURIComponent(planReference) : '';
		const resubmissionUrl = `/manage-local-plans/${encodedPlanReference}/gateway-3-resubmission`;

		return res.render(DECLARATION_VIEW_PATH, {
			pageTitle: "Are you sure you're ready to submit?",
			pageHeading: "Are you sure you're ready to submit?",
			backLinkUrl: resubmissionUrl,
			goBackUrl: resubmissionUrl
		});
	};
}

// ---------------------------------------------------------------------------
// POST declaration — completes the current submission
// ---------------------------------------------------------------------------

const SUBMISSION_COMPLETE_VIEW_PATH = 'views/manage-local-plans/gateway-3-resubmission/submission-complete.njk';

export function buildPostDeclarationPage(service: PortalService): RequestHandler {
	return async (req, res) => {
		const request = req as ResubmissionRequest;
		const planReference = getRoutePlanReference(req);
		const encodedPlanReference = planReference ? encodeURIComponent(planReference) : '';
		const currentCase = request.currentCase as Record<string, unknown>;
		const gateway3Info = currentCase?.gateway3Info as Record<string, unknown> | undefined;
		const submissions = (gateway3Info?.submissions ?? []) as {
			id: string;
			completionDate: Date | null;
			submittedDate: Date | null;
			decision: string | null;
		}[];

		// Find the current placeholder submission (last, with no completionDate/submittedDate)
		const currentSubmission = submissions.at(-1);
		if (!currentSubmission || currentSubmission.completionDate || currentSubmission.submittedDate) {
			service.logger.error(`No pending submission found for resubmission declaration ${planReference ?? ''}`);
			return res.status(500).send('No pending submission found');
		}

		const caseId = currentCase?.id as string | undefined;
		if (!caseId) {
			service.logger.error(`No case loaded for resubmission declaration ${planReference ?? ''}`);
			return res.status(500).send('No case found');
		}

		const submittedDate = new Date();

		try {
			const documentSetIds = await DocumentUtil.getDocumentSetIdsByFolderName(service, [
				getResubmissionDocumentSetFolderName(req)
			]);
			await service.db.$transaction([
				service.db.gateway3Submission.update({
					where: { id: currentSubmission.id },
					data: { submittedDate }
				}),
				service.db.gateway3Info.update({
					where: { caseId },
					data: { actualDate: submittedDate }
				}),
				DocumentUtil.commitTempDocuments(service, caseId, [...documentSetIds.values()])
			]);
		} catch (error) {
			service.logger.error({ error }, `Failed to complete resubmission for case ${planReference ?? ''}`);
			return res.status(500).send('Failed to record submission');
		}

		return res.redirect(`/manage-local-plans/${encodedPlanReference}/gateway-3-resubmission/submission-complete`);
	};
}

// ---------------------------------------------------------------------------
// GET submission complete page
// ---------------------------------------------------------------------------

export function buildGetSubmissionCompletePage(): RequestHandler {
	return (req, res) => {
		const planReference = getRoutePlanReference(req);
		const encodedPlanReference = planReference ? encodeURIComponent(planReference) : '';

		return res.render(SUBMISSION_COMPLETE_VIEW_PATH, {
			pageTitle: 'Gateway 3 submission complete',
			planOverviewUrl: `/manage-local-plans/${encodedPlanReference}`
		});
	};
}

// ---------------------------------------------------------------------------
// GET previous submission detail page
// ---------------------------------------------------------------------------

type CaseDocument = {
	guid: string;
	name: string;
	documentSetId: string;
	isDeleted: boolean;
	latestDocumentVersion: {
		originalFilename: string | null;
		fileName: string | null;
		dateCreated: Date | null;
	} | null;
};

function buildDocumentFileView(doc: CaseDocument, encodedPlanReference: string) {
	return {
		fileName: doc.latestDocumentVersion?.originalFilename ?? doc.latestDocumentVersion?.fileName ?? doc.name,
		downloadUrl: `/manage-local-plans/${encodedPlanReference}/gateway-3-resubmission/download-document/${doc.guid}`
	};
}

export function buildGetPreviousSubmissionPage(): RequestHandler {
	return (req, res) => {
		const request = req as ResubmissionRequest;
		const planReference = getRoutePlanReference(req);
		const encodedPlanReference = planReference ? encodeURIComponent(planReference) : '';
		const currentCase = request.currentCase as Record<string, unknown>;
		const gateway3Info = currentCase?.gateway3Info as Record<string, unknown> | undefined;
		const submissions = (gateway3Info?.submissions ?? []) as {
			completionDate: Date | null;
			submittedDate: Date | null;
			decision: string | null;
		}[];
		const documents = (currentCase?.documents ?? []) as CaseDocument[];

		const submissionNumberParam = req.params.submissionNumber;
		const submissionNumber = Number(submissionNumberParam);

		if (isNaN(submissionNumber) || submissionNumber < 1 || submissionNumber > submissions.length) {
			return renderNotFound(res);
		}

		// The submission at this index (0-based)
		const submission = submissions[submissionNumber - 1];
		// Only allow viewing completed/submitted submissions (not a blank placeholder)
		if (!submission.completionDate && !submission.submittedDate && !submission.decision) {
			return renderNotFound(res);
		}

		const isInitialSubmission = submissionNumber === 1;
		const effectiveDate = submission.submittedDate ?? submission.completionDate;
		const submissionDate = formatDisplayDate(effectiveDate);
		const submissionTime = formatDisplayTime(effectiveDate);

		// The BO stores the report for submission N in G3_DOCUMENT_N (gateway-3-document-N in manage)
		const reportSubmissionNumber = submissionNumber;
		const reportSetId = DOCUMENT_SET_ID[`G3_DOCUMENT_${submissionNumber}`];
		const reportDocs = reportSetId ? documents.filter((d) => d.documentSetId === reportSetId && !d.isDeleted) : [];
		const reportDocuments = reportDocs.map((doc) => ({
			fileName: doc.latestDocumentVersion?.originalFilename ?? doc.latestDocumentVersion?.fileName ?? doc.name,
			downloadUrl: `/manage-local-plans/${encodedPlanReference}/gateway-3-resubmission/download-document/${doc.guid}`,
			dateIssued: formatDisplayDate(doc.latestDocumentVersion?.dateCreated)
		}));

		// Only show completed submissions that came BEFORE the one being viewed.
		const previousSubmissions = submissions
			.slice(0, submissionNumber - 1)
			.filter((sub) => sub.completionDate || sub.submittedDate || sub.decision)
			.map((sub, index) => ({
				number: index + 1,
				submittedDate: formatDisplayDate(sub.submittedDate ?? sub.completionDate),
				url: `/manage-local-plans/${encodedPlanReference}/gateway-3-resubmission/submission/${index + 1}`
			}));

		// For submission 1: build required and optional document sections from document sets
		let documentSections: {
			heading: string;
			documents: { title: string; files: { fileName: string; downloadUrl: string }[] }[];
		}[] = [];

		if (isInitialSubmission) {
			const buildDocSection = (defs: { title: string; documentSetId: string }[]) =>
				defs.map((def) => {
					const matchingDocs = documents.filter((d) => d.documentSetId === def.documentSetId && !d.isDeleted);
					return {
						title: def.title,
						files: matchingDocs.map((d) => buildDocumentFileView(d, encodedPlanReference))
					};
				});

			documentSections = [
				{ heading: 'Required information', documents: buildDocSection(REQUIRED_DOCUMENT_DEFS) },
				{ heading: 'Optional documents', documents: buildDocSection(OPTIONAL_DOCUMENT_DEFS) }
			];
		}

		// For submission 2+: the LPA's uploads live in G3_DOCUMENT_N (separate
		// from the report set). When the BO syncs its own report into this set
		// the LPA docs get soft-deleted; if the BO hasn't synced we fall back
		// to showing all (non-deleted) docs which are the LPA uploads.
		let resubmissionDocs: { fileName: string; downloadUrl: string }[] = [];
		if (!isInitialSubmission) {
			const resubSetId = DOCUMENT_SET_ID[`G3_DOCUMENT_${submissionNumber}`];
			const allResubDocs = resubSetId ? documents.filter((d) => d.documentSetId === resubSetId) : [];
			const softDeletedDocs = allResubDocs.filter((d) => d.isDeleted);
			const lpaDocs = softDeletedDocs.length > 0 ? softDeletedDocs : allResubDocs;
			resubmissionDocs = lpaDocs.map((doc) => ({
				fileName: doc.latestDocumentVersion?.originalFilename ?? doc.latestDocumentVersion?.fileName ?? doc.name,
				downloadUrl: `/manage-local-plans/${encodedPlanReference}/gateway-3-resubmission/download-document/${doc.guid}`
			}));
		}

		return res.render(PREVIOUS_SUBMISSION_VIEW_PATH, {
			pageCaption: currentCase?.planTitle,
			submissionNumber,
			reportSubmissionNumber,
			isInitialSubmission,
			reportDocuments,
			previousSubmissions,
			submissionDate,
			submissionTime,
			submitter: currentCase?.email,
			documentSections,
			resubmissionDocuments: resubmissionDocs,
			backLinkUrl: `/manage-local-plans/${encodedPlanReference}/gateway-3-resubmission`
		});
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
		const sizeLabel = RESUBMISSION_DOCUMENTS_QUESTION.maxFileSizeLabel ?? '250MB';
		const session = req.session as unknown as {
			errors?: Record<string, { msg: string }>;
			errorSummary?: Array<{ text: string; href: string }>;
		};
		session.errors = { 'upload-form': { msg: 'Errors encountered during file upload' } };
		session.errorSummary = [{ text: `The selected file must be smaller than ${sizeLabel}`, href: '#upload-form' }];
		return res.redirect(`/manage-local-plans/${encodedPlanReference}/gateway-3-resubmission/additional-documents`);
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
	const getDeclarationPage = buildGetDeclarationPage();
	const postDeclarationPage = asyncHandler(buildPostDeclarationPage(service));
	const getSubmissionCompletePage = buildGetSubmissionCompletePage();

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
			await DocumentUtil.saveDocuments(service, req, folderName, uploadedFiles, true);
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

	const getPreviousSubmissionPage = buildGetPreviousSubmissionPage();

	// Custom download handler that works for both active and soft-deleted
	// documents. The "New or updated documents" section shows LPA uploads
	// that were soft-deleted when the BO synced its report, so the standard
	// DocumentUtil.downloadDocumentToResponse (which filters isDeleted:false)
	// would reject them.
	const downloadDocument = asyncHandler(async (req: Request, res: Response) => {
		const { documentId } = req.params;
		if (!documentId || typeof documentId !== 'string') {
			throw new Error('Missing documentId for download');
		}

		const document = await service.db.document.findFirst({
			select: {
				latestDocumentVersion: {
					select: {
						blobStorageContainer: true,
						blobStoragePath: true,
						fileName: true
					}
				}
			},
			where: { guid: documentId }
		});

		if (!document?.latestDocumentVersion) {
			throw new Error(`Could not find document version for '${documentId}'`);
		}

		const { blobStorageContainer, blobStoragePath, fileName } = document.latestDocumentVersion;
		if (!blobStorageContainer || !blobStoragePath || !fileName) {
			throw new Error(`Incomplete blob metadata for document '${documentId}'`);
		}

		const blobStorage = service.createFileStorage(undefined, blobStorageContainer);
		await blobStorage.downloadToExpressResponse(blobStoragePath, fileName, res);
	});

	return {
		loadCase,
		guardResubmission,
		getResubmissionPage,
		postResubmission,
		getUploadPage,
		postUploadPage,
		getDeclarationPage,
		postDeclarationPage,
		getSubmissionCompletePage,
		getPreviousSubmissionPage,
		downloadDocument,
		upload,
		uploadDocuments,
		deleteDocument
	};
}
