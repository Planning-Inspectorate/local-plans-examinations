import type { Request, Response } from 'express';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { PortalService } from '#service';

const VIEW_PATH = 'views/manage-local-plans/gateway-2-submission/application-declaration/application-declaration.njk';

/**
 * Renders the review declaration page.
 */
export function buildGetDeclarationPage(): AsyncRequestHandler {
	return async (req: Request, res: Response) => {
		const reference = req.params.planReference;
		const encodedReference = encodeURIComponent(reference);

		return res.render(VIEW_PATH, {
			pageTitle: 'Review declaration',
			pageHeading: 'Review declaration',
			pageCaption: 'Your application',
			backLinkUrl: `/manage-local-plans/${encodedReference}/gateway-2-submission`
		});
	};
}

/**
 * Handles the declaration form submission.
 * Validates that both checkboxes are checked, then redirects to the application-complete page.
 */
export function buildPostDeclarationPage(service: PortalService): AsyncRequestHandler {
	return async (req: Request, res: Response) => {
		const reference = req.params.planReference;
		const encodedReference = encodeURIComponent(reference);
		const { logger } = service;

		const declarations = req.body.declaration;
		const selected = Array.isArray(declarations) ? declarations : declarations ? [declarations] : [];

		const hasInformationTrue = selected.includes('informationTrue');
		const hasPrivacyNotice = selected.includes('privacyNotice');

		if (!hasInformationTrue || !hasPrivacyNotice) {
			logger.info(`Declaration validation failed for case ${reference}`);

			return res.render(VIEW_PATH, {
				pageTitle: 'Review declaration',
				pageHeading: 'Review declaration',
				pageCaption: 'Your application',
				backLinkUrl: `/manage-local-plans/${encodedReference}/gateway-2-submission`,
				errorSummary: [
					{
						text: 'You must confirm both declarations before you can submit your application.',
						href: '#declaration'
					}
				],
				errors: {
					declaration: {
						text: 'You must confirm both declarations before you can submit your application.'
					}
				},
				formValues: {
					informationTrue: hasInformationTrue,
					privacyNotice: hasPrivacyNotice
				}
			});
		}

		logger.info(`Declaration confirmed for case ${reference}`);

		return res.redirect(`/manage-local-plans/${encodedReference}/gateway-2-submission/application-complete`);
	};
}
