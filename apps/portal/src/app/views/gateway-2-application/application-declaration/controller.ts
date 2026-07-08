import type { Request, Response } from 'express';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { PortalService } from '#service';

const VIEW_PATH = 'views/gateway-2-application/application-declaration/application-declaration.njk';

/**
 * Renders the review declaration page.
 */
export function buildGetDeclarationPage(): AsyncRequestHandler {
	return async (req: Request, res: Response) => {
		const reference = req.params.reference;

		return res.render(VIEW_PATH, {
			pageTitle: 'Review declaration',
			pageHeading: 'Review declaration',
			pageCaption: 'Your application',
			backLinkUrl: `/manage-local-plans/${reference}/gateway-2-application`
		});
	};
}

/**
 * Handles the declaration form submission.
 * Validates that both checkboxes are checked, then redirects to the application-complete page.
 */
export function buildPostDeclarationPage(service: PortalService): AsyncRequestHandler {
	return async (req: Request, res: Response) => {
		const reference = req.params.reference;
		const { logger } = service;

		const declarations = req.body.declaration;
		const selected = Array.isArray(declarations) ? declarations : declarations ? [declarations] : [];

		const hasInformationTrue = selected.includes('informationTrue');
		const hasPrivacyNotice = selected.includes('privacyNotice');

		if (!hasInformationTrue || !hasPrivacyNotice) {
			logger.info(`Declaration validation failed for case ${reference}`);

			// Generate submission reference number
			const submissionReference = `SUB-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

			return res.render(VIEW_PATH, {
				pageTitle: 'Review declaration',
				pageHeading: 'Review declaration',
				pageCaption: 'Your application',
				backLinkUrl: `/manage-local-plans/${reference}/gateway-2-application`,
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
				},
				submissionReference
			});
		}

		logger.info(`Declaration confirmed for case ${reference}`);

		return res.redirect(`/manage-local-plans/${reference}/gateway-2-application/application-complete`);
	};
}
