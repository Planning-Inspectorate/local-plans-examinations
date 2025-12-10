import type { Request } from 'express';
import type { ManageService } from '#service';
import { createApplicationError } from '@pins/local-plans-lib/errors/application-error.ts';

interface SubmissionFormData {
	fullName: string;
	email: string | null;
	wantToProvideEmail: boolean;
	rating: string;
	feedback: string;
}

/**
 * Loads submission data from database and formats it for the edit journey.
 * Converts database format to form format (e.g., adds wantToProvideEmail flag).
 *
 * @param req - Express request object
 * @param service - Manage service instance
 * @returns Formatted submission data or null if not found
 */
export const loadSubmissionData = async (req: Request, service: ManageService): Promise<SubmissionFormData | null> => {
	const submissionId = req.params.id;
	try {
		const submission = await service.db.questionnaire.findUnique({
			where: { id: submissionId, isDeleted: false }
		});

		if (!submission) {
			return null;
		}

		return {
			fullName: submission.fullName,
			email: submission.email,
			wantToProvideEmail: !!submission.email,
			rating: submission.rating,
			feedback: submission.feedback
		};
	} catch (error) {
		throw createApplicationError(
			service.logger,
			`Failed to load submission ${submissionId}`,
			'This page is temporarily unavailable. Please try again later.',
			String(error)
		);
	}
};
