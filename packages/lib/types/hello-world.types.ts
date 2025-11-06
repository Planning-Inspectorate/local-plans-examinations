export interface HelloWorldFormData {
	userName: string;
	userMessage: string;
}

export interface HelloWorldAnalytics {
	questionnaire: {
		id: string;
		title: string;
		isActive: boolean;
		createdAt: Date;
	};
	responseCount: number;
	latestResponses: Array<{
		id: string;
		userName: string;
		userMessage: string;
		submittedAt: Date;
	}>;
	averageMessageLength: number;
}

export interface HelloWorldViewModel {
	questionnaire: {
		id: string;
		title: string;
	};
	formData?: HelloWorldFormData;
	errors?: Record<string, string>;
	csrfToken?: string;
}

export interface HelloWorldCompleteViewModel {
	responseId: string;
	userName: string;
	submittedAt: Date;
}
