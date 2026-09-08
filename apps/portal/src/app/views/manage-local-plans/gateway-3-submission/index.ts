import type { PortalService } from '#service';
import {
	type IRouter,
	type NextFunction,
	type Request,
	type RequestHandler,
	type Response,
	Router as createRouter
} from 'express';
import {
	buildGetJourney,
	buildGetJourneyResponseFromSession,
	buildList,
	JourneyResponse
} from '@planning-inspectorate/dynamic-forms';
import { createJourney, JOURNEY_ID } from './journey.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { CaseModel } from '@pins/local-plans-database/src/client/models/Case.ts';

type Gateway3Request = Request & {
	currentCase?: CaseModel;
};

function getRoutePlanReference(req: Request): string | undefined {
	const planReference = Array.isArray(req.params.planReference)
		? req.params.planReference[0]
		: req.params.planReference;

	return planReference || undefined;
}

function formatDisplayDate(date: Date) {
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

function buildGetJourneyResponseFromCase(service: PortalService): RequestHandler {
	return async (req, res, next) => {
		const planReference = getRoutePlanReference(req);
		if (!planReference) {
			return renderNotFound(res);
		}

		const currentCase = await service.db.case.findUnique({
			where: { reference: planReference }
		});

		if (!currentCase) {
			return renderNotFound(res);
		}

		const request = req as Gateway3Request;
		request.currentCase = currentCase;

		res.locals.journeyResponse = new JourneyResponse(JOURNEY_ID, currentCase.id, {});

		return next();
	};
}

export function setGateway3ViewLocals(req: Request, res: Response) {
	const request = req as Gateway3Request;
	const planReference = getRoutePlanReference(req);
	const currentCase = request.currentCase;

	res.locals.pageTitle = 'Gateway 3 submission';
	res.locals.pageHeading = 'Gateway 3 submission';
	res.locals.pageCaption = currentCase?.planTitle;
	res.locals.statusTag = { label: 'Ready to start', class: 'govuk-tag govuk-tag--green' };

	if (planReference) {
		const encodedPlanReference = encodeURIComponent(planReference);
		res.locals.backLinkUrl = `/manage-local-plans/${encodedPlanReference}`;
		res.locals.saveAndComeBackUrl = `/manage-local-plans/${encodedPlanReference}`;
	}

	if (currentCase?.gateway3Date) {
		res.locals.targetDate = formatDisplayDate(currentCase.gateway3Date);
	}
}

function setGateway3ViewData(req: Request, res: Response, next: NextFunction) {
	setGateway3ViewLocals(req, res);
	next();
}

function buildGateway3CheckAnswersList(): RequestHandler {
	return (req, res, next) => {
		const request = req as Gateway3Request;
		return buildList({
			pageCaption: request.currentCase?.planTitle
		})(req, res, next);
	};
}

export function gateway3SubmissionRoutes(service: PortalService): IRouter {
	const router = createRouter({ mergeParams: true });

	const getJourneyResponse = buildGetJourneyResponseFromSession(JOURNEY_ID);
	const getJourney = buildGetJourney((req, journeyResponse) => createJourney(req, journeyResponse));
	const getJourneyResponseFromCase = asyncHandler(buildGetJourneyResponseFromCase(service));

	router.get(
		'/gateway-3-submission',
		getJourneyResponse,
		getJourney,
		setGateway3ViewData,
		buildGateway3CheckAnswersList()
	);

	router.get(
		'/:planReference/gateway-3-submission',
		getJourneyResponseFromCase,
		getJourney,
		setGateway3ViewData,
		buildGateway3CheckAnswersList()
	);

	return router;
}
