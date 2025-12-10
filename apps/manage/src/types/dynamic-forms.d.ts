declare module '@planning-inspectorate/dynamic-forms/src/journey/journey-response.js' {
	export interface JourneyResponse {
		answers: Record<string, any>;
	}
}

declare module '@planning-inspectorate/dynamic-forms/src/journey/journey.js' {
	export interface JourneyOptions {
		journeyId: string;
		sections: any[];
		taskListUrl: string;
		journeyTemplate: string;
		taskListTemplate: string;
		journeyTitle: string;
		returnToListing: boolean;
		listingUrl?: string;
		makeBaseUrl: () => string;
		response: any;
		baseUrl: string;
	}

	export class Journey {
		constructor(options: JourneyOptions);
		sections: any[];
		getBackLink?: () => string;
	}
}
