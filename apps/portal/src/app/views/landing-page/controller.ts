import type { PortalService } from '#service';
import type { AsyncRequestHandler } from '@planning-inspectorate/core/util';

export function buildLandingPage(service: PortalService): AsyncRequestHandler {
	const { logger, db } = service;
	return async (req, res) => {
		let caseData;
		try {
			caseData = await db.case.findMany({
				where: { email: req.session.authenticatedEmail },
				orderBy: { createdAt: 'desc' },
				include: { lpas: true }
			});
		} catch (error) {
			logger.error({ error }, 'Error fetching case data');
			return res.status(404).render('views/layouts/error', {
				pageTitle: 'Page not found'
			});
		}

		if (!caseData || caseData.length === 0) {
			logger.warn('No case data found for user');
			return res.render('views/landing-page/view.njk', {
				pageTitle: 'All cases',
				noPlansFlag: true
			});
		}

		// Map each case into a table row (array of 5 cells matching the table head)
		const plans = caseData.map((c) => [
			{
				html: `<a class="govuk-link" data-cy="plan-link" href="/manage-local-plans/${encodeURIComponent(c.reference)}">${c.reference}</a>`
			},
			{ text: c.lpas.map((lpa) => lpa.lpaName).join(', ') || 'Unknown' },
			{ text: c.planTitle },
			{ text: getStageLabel(c) },
			{ text: '' }
		]);

		return res.render('views/landing-page/view.njk', {
			pageCaption: caseData[0]?.lpas[0]?.lpaName,
			pageTitle: 'My plans',
			noPlansFlag: false,
			plans
		});
	};
}

// Derive the current stage from which gateway dates are present
function getStageLabel(caseData: {
	submissionDate: Date | null;
	gateway3Date: Date | null;
	gateway2Date: Date | null;
	gateway1Date: Date | null;
}): string {
	if (caseData.submissionDate) return 'Examination';
	if (caseData.gateway3Date) return 'Gateway 3';
	if (caseData.gateway2Date) return 'Gateway 2';
	if (caseData.gateway1Date) return 'Gateway 1';
	return 'Gateway 1';
}
