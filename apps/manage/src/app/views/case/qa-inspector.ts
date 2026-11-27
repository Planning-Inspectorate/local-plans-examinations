import type { IRouter, NextFunction, Request, Response } from 'express';
import type { ManageService } from '#service';
import * as authSession from '@planning-inspectorate/core/auth';
import { asyncHandler } from '@planning-inspectorate/core/util';
import {
	buildGetJourney,
	buildSave,
	question,
	validate,
	validationErrorHandler,
	JourneyResponse
} from '@planning-inspectorate/dynamic-forms';
import { COMMON_CONSTS } from '../../classes/common-consts.ts';
import { getParam, updateCaseHistory } from './controller.ts';
import { questions } from './questions.ts';
import { createQaInspectorJourney } from './journey.ts';
import { formatDateToString } from '../../util/date.ts';
import { pushAlertToSession } from '../../util/alert.ts';
import {
	addQaInspector,
	clearQaInspectorDraft,
	getQaInspectorDraft,
	getQaInspectorUrls,
	getQaInspectors,
	removeQaInspector,
	setQaInspectorDraft
} from './qa-inspector-helper.ts';
import { escapeHtml } from './assessor-helper.ts';

const CONFIRM_TEMPLATE = 'views/layouts/submit-documents-check-your-answers';
const REMOVE_TEMPLATE = 'views/layouts/remove-qa-inspector.njk';

type InspectorCase = { id: string; planTitle: string | null };

function getCurrentUser(req: Request): string {
	return authSession.getAccount(req.session)?.name ?? 'Unknown';
}

/**
 * The add QA inspector journey for the examination tab's QA section, mirroring the assessor journeys:
 * the answers are kept in the session and only written to the database once confirmed.
 */
export function registerQaInspectorJourney(router: IRouter, service: ManageService): void {
	const basePath = `/examination/${COMMON_CONSTS.QA_INSPECTOR_BASE_PATH}`;

	const loadCase = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
		const reference = getParam(req.params.reference);
		const caseRecord = await service.db.case.findUnique({
			where: { reference },
			select: { id: true, planTitle: true }
		});
		if (!caseRecord) {
			return res.status(404).render('views/errors/404.njk');
		}
		res.locals.planTitle = caseRecord.planTitle;
		res.locals.reference = reference;
		res.locals.inspectorCase = caseRecord;
		next();
	});

	const resolveQuestions = asyncHandler(async (_req: Request, _res: Response, next: NextFunction) => {
		next();
	});

	// the answer is only written to the database once it has been confirmed, so the journey reads it from the session
	const getJourneyResponse = (req: Request, res: Response, next: NextFunction) => {
		const draft = getQaInspectorDraft(req, getParam(req.params.reference));
		res.locals.journeyResponse = new JourneyResponse(
			COMMON_CONSTS.QA_INSPECTOR_JOURNEY_ID,
			'',
			draft ? { qaInspectorName: draft.name ?? '', qaInspectorAppointmentDate: draft.appointedDate } : {}
		);
		next();
	};

	const getJourney = buildGetJourney((req, journeyResponse) =>
		createQaInspectorJourney(req, journeyResponse, questions)
	);

	const saveDraft = async ({ req, data }: { req: Request; data: Record<string, any> }) => {
		const reference = getParam(req.params.reference);
		const draft = { ...(getQaInspectorDraft(req, reference) ?? { name: '' }) };
		if (data.answers?.qaInspectorName !== undefined) {
			draft.name = String(data.answers.qaInspectorName).trim();
			draft.lastEdited = 'name';
		}
		if (data.answers?.qaInspectorAppointmentDate !== undefined) {
			draft.appointedDate = data.answers.qaInspectorAppointmentDate
				? String(data.answers.qaInspectorAppointmentDate)
				: undefined;
			draft.lastEdited = 'date';
		}
		setQaInspectorDraft(req, reference, draft);
	};

	const getConfirm = asyncHandler(async (req: Request, res: Response) => {
		const reference = getParam(req.params.reference);
		const urls = getQaInspectorUrls(reference);
		const draft = getQaInspectorDraft(req, reference);
		if (!draft?.name) {
			return res.redirect(urls.questionUrl);
		}
		// when the inspector is added without choosing a date, the appointment date is the current date
		const appointedDisplay = draft.appointedDate
			? formatDateToString(new Date(draft.appointedDate))
			: formatDateToString(new Date());
		res.render(CONFIRM_TEMPLATE, {
			caseReference: reference,
			journeyId: COMMON_CONSTS.QA_INSPECTOR_JOURNEY_ID,
			section: COMMON_CONSTS.QA_INSPECTOR_SECTION,
			titleHeading: 'Confirm QA inspector details',
			backLink: draft.lastEdited === 'date' ? urls.dateUrl : urls.questionUrl,
			answersToReview: [
				// the template renders the value as html
				{ name: 'QA inspector', value: escapeHtml(draft.name), url: urls.questionUrl },
				{ name: 'Date appointed', value: appointedDisplay, url: urls.dateUrl }
			],
			submitButtonText: 'Save and continue'
		});
	});

	const postConfirm = asyncHandler(async (req: Request, res: Response) => {
		const reference = getParam(req.params.reference);
		const urls = getQaInspectorUrls(reference);
		const draft = getQaInspectorDraft(req, reference);
		if (!draft?.name) {
			return res.redirect(urls.questionUrl);
		}
		const caseRecord = res.locals.inspectorCase as InspectorCase;

		await addQaInspector(service.db, caseRecord.id, {
			name: draft.name,
			appointmentDate: draft.appointedDate ? new Date(draft.appointedDate) : new Date()
		});
		clearQaInspectorDraft(req, reference);

		await updateCaseHistory(service, req, service.db, { qaInspectorName: null }, {}, reference, getCurrentUser(req), {
			qaInspectorName: `QA inspector ${draft.name} added`
		});
		pushAlertToSession(req, 'success', 'QA inspector added');

		res.redirect(urls.tabUrl);
	});

	const getRemove = asyncHandler(async (req: Request, res: Response) => {
		const reference = getParam(req.params.reference);
		const urls = getQaInspectorUrls(reference);
		const caseRecord = res.locals.inspectorCase as InspectorCase;
		const inspectors = await getQaInspectors(service.db, caseRecord.id);
		const inspector = inspectors.find((item) => item.id === getParam(req.params.qaInspectorId));
		if (!inspector) {
			return res.redirect(urls.tabUrl);
		}
		res.render(REMOVE_TEMPLATE, {
			reference,
			qaInspectorName: inspector.name,
			qaInspectorValue: inspector.name,
			backLink: urls.tabUrl,
			cancelLink: urls.tabUrl,
			formAction: `${urls.removeUrl}/${encodeURIComponent(inspector.id)}`
		});
	});

	const postRemove = asyncHandler(async (req: Request, res: Response) => {
		const reference = getParam(req.params.reference);
		const urls = getQaInspectorUrls(reference);
		const caseRecord = res.locals.inspectorCase as InspectorCase;
		const inspector = await removeQaInspector(service.db, caseRecord.id, getParam(req.params.qaInspectorId));
		// only remove the inspector if it is still the one the user was asked to confirm
		if (!inspector || String(req.body?.qaInspector ?? '') !== inspector.name) {
			return res.redirect(urls.tabUrl);
		}

		await updateCaseHistory(service, req, service.db, { qaInspectorName: null }, {}, reference, getCurrentUser(req), {
			qaInspectorName: `QA inspector ${inspector.name} removed`
		});

		res.redirect(urls.tabUrl);
	});

	router.get(`${basePath}/check`, loadCase, resolveQuestions, getConfirm);
	router.post(`${basePath}/check`, loadCase, resolveQuestions, postConfirm);

	router.get(`${basePath}/remove/:qaInspectorId`, loadCase, resolveQuestions, getRemove);
	router.post(`${basePath}/remove/:qaInspectorId`, loadCase, resolveQuestions, postRemove);

	router.get(`${basePath}/:section/:question`, loadCase, resolveQuestions, getJourneyResponse, getJourney, question);
	router.post(
		`${basePath}/:section/:question`,
		loadCase,
		resolveQuestions,
		getJourneyResponse,
		getJourney,
		validate,
		validationErrorHandler,
		buildSave(saveDraft, true)
	);
}
