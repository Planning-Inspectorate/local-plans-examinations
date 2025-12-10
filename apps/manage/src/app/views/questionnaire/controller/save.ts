import type { Request } from 'express';
import type { ManageService } from '#service';
import { createApplicationError } from '@pins/local-plans-lib/errors/application-error.ts';

interface SaveParams {
	req: Request;
	journeyId: string;
	referenceId: string;
	data: {
		answers: Record<string, unknown>;
	};
}

/**
 * Creates save function that updates questionnaire submission in database.
 *
 * @param service - Manage service instance
 * @returns Async function that saves form data to database
 */
export const createSaveToDatabase = (service: ManageService) => {
	return async ({ req, data }: SaveParams): Promise<void> => {
		const submissionId = req.params.id;

		try {
			await service.db.questionnaire.update({
				where: { id: submissionId },
				data: {
					fullName: data.answers.fullName as string,
					email: (data.answers.email as string) || null,
					rating: data.answers.rating as string,
					feedback: data.answers.feedback as string,
					updatedAt: new Date()
				}
			});
			req.session.successMessage = 'Changes saved successfully';
			service.logger.info(`Successfully updated questionnaire submission: ${submissionId}`);
		} catch (error) {
			throw createApplicationError(
				service.logger,
				`Failed to update submission ${submissionId}`,
				'Your changes could not be saved. Please try again.',
				String(error)
			);
		}
	};
};
