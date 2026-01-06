import type { EditConfig } from '../../core/types.ts';

/**
 * Feedback-specific form answers interface
 */
export interface FeedbackAnswers {
	fullName: string;
	email: string | null;
	rating: string;
	feedback: string;
}

/**
 * Feedback-specific edit configuration
 */
export const createFeedbackEditConfig = (): EditConfig<FeedbackAnswers> => {
	const allowedFields = {
		'full-name': {
			key: 'fullName' as keyof FeedbackAnswers,
			required: true,
			validator: (value: string) => (!value?.trim() ? 'Full name cannot be empty' : null)
		},
		email: {
			key: 'email' as keyof FeedbackAnswers,
			required: false
		},
		rating: {
			key: 'rating' as keyof FeedbackAnswers,
			required: true,
			validator: (value: string) => (!value?.trim() ? 'Rating cannot be empty' : null)
		},
		feedback: {
			key: 'feedback' as keyof FeedbackAnswers,
			required: true,
			validator: (value: string) => (!value?.trim() ? 'Feedback cannot be empty' : null)
		}
	};

	return {
		allowedFields,
		getFieldValue: (body: any, questionKey: string) => body[questionKey === 'full-name' ? 'fullName' : questionKey],
		mapToAnswers: (questionKey: string, value: any, current: FeedbackAnswers) => {
			const config = allowedFields[questionKey as keyof typeof allowedFields];
			if (!config) return current;

			const processedValue = config.key === 'email' && !value ? null : String(value).trim();

			return {
				...current,
				[config.key]: processedValue
			};
		},
		submissionMapper: (submission: any): FeedbackAnswers => ({
			fullName: submission.fullName,
			email: submission.email,
			rating: submission.rating,
			feedback: submission.feedback
		}),
		routeConfig: {
			baseRoute: '/feedback',
			editRoute: '/feedback/:id/edit',
			detailRoute: '/feedback/:id'
		},
		messages: {
			notFound: 'Feedback submission not found',
			updated: 'Feedback updated successfully',
			updateFailed: 'Unable to save changes. Please try again.'
		}
	};
};
