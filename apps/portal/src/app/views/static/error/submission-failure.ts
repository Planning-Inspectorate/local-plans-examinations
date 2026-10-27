import type { Response } from 'express';

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
