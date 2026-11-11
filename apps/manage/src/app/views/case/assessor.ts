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
	type Journey,
	JourneyResponse,
	type SaveDataFn
} from '@planning-inspectorate/dynamic-forms';
import { COMMON_CONSTS } from '../../classes/common-consts.ts';
import { getParam, updateCaseHistory } from './controller.ts';
import { questions, getQuestions } from './questions.ts';
import { createGateway2AssessorJourney, createGateway3AssessorJourney } from './journey.ts';
import { formatDateToString } from '../../util/date.ts';
import { pushAlertToSession } from '../../util/alert.ts';
import {
	sendGw2AssessorAppointedNotifyEmail,
	sendGw3AssessorAppointedNotifyEmail
} from '../../notify/notify-helper.ts';
import {
	ASSESSOR_SECTION,
	type AssessorDetails,
	type AssessorGateway,
	type AssessorSaveDetails,
	clearAssessorDraft,
	escapeHtml,
	getAssessorDraft,
	getAssessorUrls,
	getGateway2Assessor,
	getGateway3Assessor,
	resolveAssessorDisplayName,
	saveGateway2Assessor,
	saveGateway3Assessor,
	setAssessorDraft
} from './assessor-helper.ts';

interface AssessorJourneyConfig {
	journeyId: string;
	createJourney: (req: Request, response: JourneyResponse, questions: Record<string, any>) => Journey;
	sendAppointedEmail: (service: ManageService, req: Request, reference: string, assessorName: string) => Promise<void>;
	/** Get the assessor from this gateway's own table */
	getAssessor: (db: ManageService['db'], caseId: string) => Promise<AssessorDetails | null>;
	/** Save the assessor to this gateway's own table */
	saveAssessor: (db: ManageService['db'], caseId: string, details: AssessorSaveDetails) => Promise<unknown>;
}

const ASSESSOR_JOURNEYS: Record<AssessorGateway, AssessorJourneyConfig> = {
	'gateway-2': {
		journeyId: COMMON_CONSTS.GATEWAY_2_ASSESSOR_JOURNEY_ID,
		createJourney: createGateway2AssessorJourney,
		sendAppointedEmail: sendGw2AssessorAppointedNotifyEmail,
		getAssessor: getGateway2Assessor,
		saveAssessor: saveGateway2Assessor
	},
	'gateway-3': {
		journeyId: COMMON_CONSTS.GATEWAY_3_ASSESSOR_JOURNEY_ID,
		createJourney: createGateway3AssessorJourney,
		sendAppointedEmail: sendGw3AssessorAppointedNotifyEmail,
		getAssessor: getGateway3Assessor,
		saveAssessor: saveGateway3Assessor
	}
};

const CONFIRM_TEMPLATE = 'views/layouts/submit-documents-check-your-answers';
const REMOVE_TEMPLATE = 'views/layouts/remove-assessor.njk';

type AssessorCase = { id: string; planTitle: string | null };

function getCurrentUser(req: Request): string {
	return authSession.getAccount(req.session)?.name ?? 'Unknown';
}

/**
 * Register the add / remove assessor pages for a gateway tab:
 * - GET|POST /<gateway>/assessor/assessors/<question>  who is the assessor (held in the session)
 * - GET|POST /<gateway>/assessor/check                 confirm and send notification
 * - GET|POST /<gateway>/assessor/remove                remove assessor
 *
 * This must be registered before the gateway tab journeys, as `/<gateway>/assessor/check` would
 * otherwise be matched by their `/<gateway>/:section/:question` routes.
 */
export function registerAssessorJourney(router: IRouter, service: ManageService, gateway: AssessorGateway): void {
	const { journeyId, createJourney, sendAppointedEmail, getAssessor, saveAssessor } = ASSESSOR_JOURNEYS[gateway];
	const basePath = `/${gateway}/assessor`;

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
		res.locals.assessorCase = caseRecord;
		next();
	});

	const resolveQuestions = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
		await getQuestions(service, req);
		next();
	});

	// The answer is only written to the database once it has been confirmed, so the journey reads it from the session
	const getJourneyResponse = (req: Request, res: Response, next: NextFunction) => {
		const draft = getAssessorDraft(req, getParam(req.params.reference), gateway);
		res.locals.journeyResponse = new JourneyResponse(journeyId, '', draft ? { assessorName: draft } : {});
		next();
	};

	const getJourney = buildGetJourney((req, journeyResponse) => createJourney(req, journeyResponse, questions));

	const saveDraft: SaveDataFn = async ({ req, data }: { req: Request; data: Record<string, any> }) => {
		const assessorName = String(data.answers?.assessorName ?? '').trim();
		setAssessorDraft(req, getParam(req.params.reference), gateway, assessorName);
	};

	const getConfirm = asyncHandler(async (req: Request, res: Response) => {
		const reference = getParam(req.params.reference);
		const urls = getAssessorUrls(reference, gateway);
		const draft = getAssessorDraft(req, reference, gateway);
		if (!draft) {
			return res.redirect(urls.questionUrl);
		}
		const assessorDisplayName = await resolveAssessorDisplayName(service, req, gateway, draft);
		res.render(CONFIRM_TEMPLATE, {
			caseReference: reference,
			journeyId,
			section: ASSESSOR_SECTION,
			titleHeading: 'Confirm and send notification',
			backLink: urls.questionUrl,
			answersToReview: [
				// the template renders the value as html
				{ name: 'Assessor', value: escapeHtml(assessorDisplayName), url: urls.questionUrl },
				// the appointed date is always the day the assessor is confirmed
				{ name: 'Date appointed', value: formatDateToString(new Date()), url: undefined }
			],
			notificationTextLPA: 'A notification will be sent to the assessor and the planning authority.',
			submitButtonText: 'Confirm and send'
		});
	});

	const postConfirm = asyncHandler(async (req: Request, res: Response) => {
		const reference = getParam(req.params.reference);
		const urls = getAssessorUrls(reference, gateway);
		const draft = getAssessorDraft(req, reference, gateway);
		if (!draft) {
			return res.redirect(urls.questionUrl);
		}
		const caseRecord = res.locals.assessorCase as AssessorCase;
		const assessorDisplayName = await resolveAssessorDisplayName(service, req, gateway, draft);

		await saveAssessor(service.db, caseRecord.id, { assessorName: draft, assessorAppointmentDate: new Date() });
		clearAssessorDraft(req, reference, gateway);

		await updateCaseHistory(service, req, service.db, { assessorName: null }, {}, reference, getCurrentUser(req), {
			assessorName: `Assessor ${assessorDisplayName} added`
		});
		pushAlertToSession(req, 'success', 'Assessor added');

		try {
			await sendAppointedEmail(service, req, reference, draft);
		} catch (error) {
			// the assessor has already been saved, so do not block the user if the notification could not be sent
			service.logger.error({ error, reference, gateway }, 'Failed to send assessor appointed notification');
		}

		res.redirect(urls.tabUrl);
	});

	const getRemove = asyncHandler(async (req: Request, res: Response) => {
		const reference = getParam(req.params.reference);
		const urls = getAssessorUrls(reference, gateway);
		const caseRecord = res.locals.assessorCase as AssessorCase;
		const current = await getAssessor(service.db, caseRecord.id);
		if (!current?.assessorName) {
			return res.redirect(urls.tabUrl);
		}
		res.render(REMOVE_TEMPLATE, {
			reference,
			assessorName: await resolveAssessorDisplayName(service, req, gateway, current.assessorName),
			backLink: urls.tabUrl,
			cancelLink: urls.tabUrl,
			formAction: urls.removeUrl
		});
	});

	const postRemove = asyncHandler(async (req: Request, res: Response) => {
		const reference = getParam(req.params.reference);
		const urls = getAssessorUrls(reference, gateway);
		const caseRecord = res.locals.assessorCase as AssessorCase;
		const current = await getAssessor(service.db, caseRecord.id);
		if (!current?.assessorName) {
			return res.redirect(urls.tabUrl);
		}
		const assessorDisplayName = await resolveAssessorDisplayName(service, req, gateway, current.assessorName);

		await saveAssessor(service.db, caseRecord.id, { assessorName: null, assessorAppointmentDate: null });
		clearAssessorDraft(req, reference, gateway);

		await updateCaseHistory(service, req, service.db, { assessorName: null }, {}, reference, getCurrentUser(req), {
			assessorName: `Assessor ${assessorDisplayName} removed`
		});

		res.redirect(urls.tabUrl);
	});

	router.get(`${basePath}/check`, loadCase, resolveQuestions, getConfirm);
	router.post(`${basePath}/check`, loadCase, resolveQuestions, postConfirm);

	router.get(`${basePath}/remove`, loadCase, resolveQuestions, getRemove);
	router.post(`${basePath}/remove`, loadCase, resolveQuestions, postRemove);

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
