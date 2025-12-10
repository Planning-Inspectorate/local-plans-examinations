import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { ManageService } from '#service';

/**
 * Creates controller for delete confirmation page.
 * Displays warning and submission details before deletion.
 *
 * @param service - The manage service instance
 * @returns Express route handler function
 */
export const createDeleteConfirmController = (service: ManageService): AsyncRequestHandler => {
	return async (req, res) => {
		const { id } = req.params;
		service.logger.info(`Displaying delete confirmation for submission: ${id}`);

		const submission = await service.db.questionnaire.findUnique({
			where: { id, isDeleted: false }
		});

		if (!submission) {
			service.logger.warn(`Submission not found for deletion: ${id}`);
			return res.status(404).render('views/errors/404.njk', {
				pageTitle: 'Not Found',
				message: 'Questionnaire submission not found'
			});
		}

		res.render('views/questionnaire/templates/delete-confirm.njk', {
			pageHeading: 'Delete Questionnaire Submission',
			submission
		});
	};
};

/**
 * Creates controller for deleting a submission.
 * Performs soft delete and redirects with success message.
 *
 * @param service - The manage service instance
 * @returns Express route handler function
 */
export const createDeleteController = (service: ManageService): AsyncRequestHandler => {
	return async (req, res) => {
		const { id } = req.params;
		service.logger.info(`Deleting questionnaire submission: ${id}`);

		try {
			await service.db.questionnaire.update({
				where: { id },
				data: { isDeleted: true }
			});

			service.logger.info(`Successfully deleted questionnaire submission: ${id}`);
			req.session.successMessage = 'Questionnaire submission deleted successfully';
			res.redirect('/questionnaire');
		} catch (error) {
			service.logger.error(`Failed to delete submission ${id}: ${String(error)}`);
			req.session.errorMessage = 'Failed to delete submission';
			res.redirect(`/questionnaire/${id}`);
		}
	};
};
