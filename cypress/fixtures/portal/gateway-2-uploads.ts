type Gateway2UploadAnswer = {
	heading: string;
	caption: string;
	fieldName: string;
	path: string;
	section: string;
	addCy: string;
};

export const gateway2UploadAnswers = {
	coveringLetter: {
		heading: 'Upload your Gateway 2 covering letter',
		caption: 'Procedural documents',
		fieldName: 'gateway2CoverLetter',
		path: 'covering-letter',
		section: 'procedural',
		addCy: 'add-gateway-2-covering-letter'
	},
	localPlanTimetable: {
		heading: 'Upload local plan timetable',
		caption: 'Procedural documents',
		fieldName: 'localPlanTimetable',
		path: 'local-plan-timetable',
		section: 'procedural',
		addCy: 'add-local-plan-timetable'
	}
} as const satisfies Record<string, Gateway2UploadAnswer>;
