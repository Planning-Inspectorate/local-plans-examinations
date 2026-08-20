type Gateway2UploadAnswer = {
	heading: string;
	caption: string;
	fieldName: string;
	path: string;
	section: string;
};

export const gateway2UploadAnswers = {
	coveringLetter: {
		heading: 'Upload your Gateway 2 covering letter',
		caption: 'Procedural documents',
		fieldName: 'gateway2CoverLetter',
		path: 'covering-letter',
		section: 'procedural'
	}
} as const satisfies Record<string, Gateway2UploadAnswer>;
