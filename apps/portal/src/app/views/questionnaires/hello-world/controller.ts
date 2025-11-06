import type { PortalService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-examinations-lib/util/async-handler.ts';
import type { HelloWorldViewModel } from '@pins/local-plans-examinations-lib/types/hello-world.types.ts';

/**
 * Display the hello world questionnaire form
 */
export function buildHelloWorldForm(service: PortalService): AsyncRequestHandler {
	const { logger } = service;

	return async (req, res) => {
		try {
			const questionnaire = await service.helloWorldService.getQuestionnaire();

			const viewModel: HelloWorldViewModel = {
				questionnaire: {
					id: questionnaire.id,
					title: questionnaire.title
				},
				formData: {
					userName: '',
					userMessage: ''
				}
			};

			logger.info({ questionnaireId: questionnaire.id }, 'Displaying hello world form');

			return res.render('views/questionnaires/hello-world/form.njk', {
				pageTitle: questionnaire.title,
				...viewModel
			});
		} catch (error) {
			logger.error({ error }, 'Failed to load hello world form');
			return res.status(500).render('views/errors/500.njk');
		}
	};
}

/**
 * Handle hello world form submission
 */
export function buildHelloWorldSubmit(service: PortalService): AsyncRequestHandler {
	const { logger } = service;

	return async (req, res) => {
		try {
			const formData = {
				userName: req.body.userName || '',
				userMessage: req.body.userMessage || ''
			};

			// Submit the response
			const response = await service.helloWorldService.submitResponse(formData);

			logger.info({ responseId: response.id }, 'Hello world form submitted successfully');

			// Redirect to completion page
			return res.redirect(`/questionnaires/hello-world/complete?responseId=${response.id}`);
		} catch (error) {
			logger.error({ error }, 'Failed to submit hello world form');

			// Get questionnaire for re-rendering form with errors
			const questionnaire = await service.helloWorldService.getQuestionnaire();

			const viewModel: HelloWorldViewModel = {
				questionnaire: {
					id: questionnaire.id,
					title: questionnaire.title
				},
				formData: {
					userName: req.body.userName || '',
					userMessage: req.body.userMessage || ''
				},
				errors: {
					general: error instanceof Error ? error.message : 'An error occurred'
				}
			};

			return res.status(400).render('views/questionnaires/hello-world/form.njk', {
				pageTitle: questionnaire.title,
				...viewModel
			});
		}
	};
}

/**
 * Display completion page
 */
export function buildHelloWorldComplete(service: PortalService): AsyncRequestHandler {
	const { logger } = service;

	return async (req, res) => {
		const responseId = req.query.responseId as string;

		if (!responseId) {
			logger.warn('No response ID provided for completion page');
			return res.redirect('/questionnaires');
		}

		try {
			// You could fetch the response details here if needed
			// For now, we'll just show a simple completion message

			logger.info({ responseId }, 'Displaying hello world completion page');

			return res.render('views/questionnaires/hello-world/complete.njk', {
				pageTitle: 'Thank You',
				responseId
			});
		} catch (error) {
			logger.error({ error, responseId }, 'Failed to load completion page');
			return res.status(500).render('views/errors/500.njk');
		}
	};
}
