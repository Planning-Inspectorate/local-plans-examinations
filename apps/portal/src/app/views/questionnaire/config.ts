// Configuration constants for the questionnaire
export const QUESTIONNAIRE_CONFIG = {
	// Journey configuration
	JOURNEY_ID: 'questionnaire',

	// Validation limits
	VALIDATION: {
		FULL_NAME_MAX_LENGTH: 250,
		FEEDBACK_MAX_LENGTH: 2000,
		EMAIL_MAX_LENGTH: 254 // RFC 5321 standard
	},

	// Error messages
	MESSAGES: {
		REQUIRED: {
			FULL_NAME: 'Enter your full name',
			EMAIL: 'Enter your email address',
			FEEDBACK: 'Enter your feedback',
			RATING: 'Select a rating'
		},
		VALIDATION: {
			FULL_NAME_TOO_LONG: 'Full name must be 250 characters or less',
			FEEDBACK_TOO_LONG: 'Feedback must be 2000 characters or less',
			EMAIL_TOO_LONG: 'Email address must be 254 characters or less',
			EMAIL_INVALID: 'Enter a valid email address'
		}
	},

	// Component types (mirroring dynamic-forms constants for consistency)
	COMPONENT_TYPES: {
		SINGLE_LINE_INPUT: 'single-line-input',
		TEXT_ENTRY: 'text-entry',
		RADIO: 'radio'
	},

	// Question URLs and field names
	QUESTIONS: {
		FULL_NAME: {
			fieldName: 'fullName',
			url: 'full-name'
		},
		EMAIL: {
			fieldName: 'email',
			url: 'email'
		},
		FEEDBACK: {
			fieldName: 'feedback',
			url: 'feedback'
		},
		RATING: {
			fieldName: 'rating',
			url: 'rating'
		}
	},

	// Section configuration
	SECTIONS: {
		PERSONAL: {
			name: 'Personal Information',
			segment: 'personal'
		},
		EXPERIENCE: {
			name: 'Your Experience',
			segment: 'experience'
		}
	},

	// Question options
	OPTIONS: {
		RATING: [
			{ text: 'Excellent', value: 'excellent' },
			{ text: 'Good', value: 'good' },
			{ text: 'Average', value: 'average' },
			{ text: 'Poor', value: 'poor' }
		] as Array<{ text: string; value: string }>
	},

	// Templates and URLs
	TEMPLATES: {
		FORMS_QUESTION: 'views/layouts/forms-question.njk',
		FORMS_CHECK_ANSWERS: 'views/layouts/forms-check-your-answers.njk',
		CHECK_ANSWERS: 'views/questionnaire/check-answers.njk',
		SUCCESS: 'views/questionnaire/success.njk'
	},

	// Routing
	ROUTES: {
		CHECK_YOUR_ANSWERS: 'check-your-answers',
		SUCCESS: 'success',
		FIRST_QUESTION: '/personal/full-name'
	}
} as const;

// Type-safe access to configuration
export type QuestionnaireConfig = typeof QUESTIONNAIRE_CONFIG;
