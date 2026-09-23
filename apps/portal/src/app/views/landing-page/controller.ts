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
				include: { lpas: true, gateway2Info: true, gateway3Info: true }
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
			{ text: c.lpas[0]?.lpaName || '-' },
			{ text: c.planTitle },
			{ text: getStageLabel(c) },
			{ html: getCaseStatusHTMLTag(c) }
		]);

		return res.render('views/landing-page/view.njk', {
			pageCaption: caseData[0]?.lpas[0]?.lpaName,
			pageTitle: 'My plans',
			noPlansFlag: false,
			plans
		});
	};
}

export function getStageLabel(caseData: {
	gateway2Info?: { actualDate?: Date | null; reportIssuedDate?: Date | null } | null;
	gateway3Info?: { actualDate?: Date | null; completionDate?: Date | null } | null;
}): string {
	if (caseData.gateway3Info?.completionDate || caseData.gateway3Info?.actualDate) return 'Examination';
	if (caseData.gateway2Info?.reportIssuedDate) return 'Gateway 3';
	if (caseData.gateway2Info?.actualDate) return 'Gateway 2';
	return 'Gateway 2';
}

export function getCaseStatusHTMLTag(caseData: {
	gateway2Info?: { actualDate?: Date | null; reportIssuedDate?: Date | null } | null;
	gateway3Info?: { actualDate?: Date | null; completionDate?: Date | null } | null;
}): string {
	// Only "Gateway 2 with actualDate and no later progress" is Under review; everything else Ready to start
	const laterProgress =
		caseData.gateway3Info?.completionDate ||
		caseData.gateway3Info?.actualDate ||
		caseData.gateway2Info?.reportIssuedDate;

	if (!laterProgress && caseData.gateway2Info?.actualDate) {
		return `<strong class="${statusTag[6].class}">${statusTag[6].label}</strong>`;
	}
	return `<strong class="${statusTag[0].class}">${statusTag[0].label}</strong>`;
}

// // Derive the current stage from which gateway dates are present
// export function getStageLabel(caseData: {
// 	submissionDate: Date | null;
// 	gateway3Date: Date | null;
// 	gateway2Date: Date | null;
// 	gateway1Date: Date | null;
// }): string {
// 	if (caseData.submissionDate) return 'Examination';
// 	if (caseData.gateway3Date) return 'Gateway 3';
// 	if (caseData.gateway2Date) return 'Gateway 2';
// 	if (caseData.gateway1Date) return 'Gateway 1';
// 	return 'Gateway 1';
// }
//
// export function getCaseStatusHTMLTag(caseData: {
// 	gateway2Info?: { actualDate?: Date | null; reportIssuedDate?: Date | null } | null;
// 	gateway3Info?: { actualDate?: Date | null; completionDate?: Date | null } | null;
// }): string {
// 	// Gateway 3 has a completionDate or actualDate = Examination - Ready to start
// 	// Gateway 2 has a reportIssuedDate = Gateway 3 - Ready to start
// 	// Gateway 2 has an actualDate = Gateway 2 - Under review
// 	// None of the above = Gateway 2 - Ready to start
// 	if (caseData.gateway3Info?.completionDate || caseData.gateway3Info?.actualDate) {
// 		return `<strong class="${statusTag[0].class}">${statusTag[0].label}</strong>`;
// 	}
//
// 	if (caseData.gateway2Info?.reportIssuedDate) {
// 		return `<strong class="${statusTag[0].class}">${statusTag[0].label}</strong>`;
// 	}
//
// 	if (caseData.gateway2Info?.actualDate) {
// 		return `<strong class="${statusTag[6].class}">${statusTag[6].label}</strong>`;
// 	}
//
// 	return `<strong class="${statusTag[0].class}">${statusTag[0].label}</strong>`;
// }

const statusTag = {
	0: { label: 'Ready to start', class: 'govuk-tag govuk-tag--green' },
	1: { label: 'In progress', class: 'govuk-tag govuk-tag--blue' },
	2: { label: 'With PINS', class: 'govuk-tag govuk-tag--yellow' },
	3: { label: 'Action required', class: 'govuk-tag govuk-tag--red' },
	4: { label: 'Invalid', class: 'govuk-tag govuk-tag--grey' },
	5: { label: 'Completed', class: 'govuk-body' },
	6: { label: 'Under review', class: 'govuk-tag govuk-tag--yellow' }
};
