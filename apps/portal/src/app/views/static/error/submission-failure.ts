import type { ErrorRequestHandler, Response } from 'express';
import type { PortalService } from '#service';

export const SUBMISSION_FAILURE_VIEW_PATH = 'views/static/error/submission-failure.njk';

export const SUBMISSION_FAILURE_PAGE_TITLE = 'Sorry, there is a problem with the service';

export interface SubmissionFailureOptions {
	/** the plan reference, used to build the 'return to your plan' link */
	planReference?: string | null;
}

/**
 * Renders the shared 'failed submission' error page.
 *
 * Shown whenever a submission (Gateway 2, Gateway 3, Gateway 3 resubmission or
 * Examination) could not be completed - for example because of a database failure -
 * so the LPA understands their submission is not complete, but their answers are saved.
 */
export function renderSubmissionFailurePage(res: Response, { planReference }: SubmissionFailureOptions = {}) {
	const encodedPlanReference = planReference ? encodeURIComponent(planReference) : undefined;

	return res.status(500).render(SUBMISSION_FAILURE_VIEW_PATH, {
		pageTitle: SUBMISSION_FAILURE_PAGE_TITLE,
		pageHeading: SUBMISSION_FAILURE_PAGE_TITLE,
		planOverviewUrl: encodedPlanReference
			? `/manage-local-plans/${encodedPlanReference}`
			: '/manage-local-plans/your-plans'
	});
}

/**
 * Mount after submission routes at their final declaration URLs, including the
 * future examination route. This also catches failures in upstream middleware.
 * Controllers must set res.locals.submissionCompleted after committing so later
 * errors cannot incorrectly tell the LPA that their submission failed.
 */
export function buildSubmissionFailureHandler(service: PortalService): ErrorRequestHandler {
	return (error: unknown, req, res, next) => {
		const status =
			error && typeof error === 'object'
				? (('statusCode' in error ? error.statusCode : undefined) ?? ('status' in error ? error.status : undefined))
				: undefined;
		if (
			req.method !== 'POST' ||
			req.path !== '/' ||
			res.headersSent ||
			res.locals.submissionCompleted ||
			(typeof status === 'number' && status < 500)
		) {
			return next(error);
		}

		const rawReference = req.params.planReference;
		const planReference = Array.isArray(rawReference) ? rawReference[0] : rawReference;
		service.logger.error({ error, planReference }, 'Failed to complete submission');
		return renderSubmissionFailurePage(res, { planReference });
	};
}
