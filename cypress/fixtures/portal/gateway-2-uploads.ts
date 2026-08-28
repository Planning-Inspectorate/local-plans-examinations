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
	},
	draftStatementOfSoundness: {
		heading: 'Upload your draft statement of soundness',
		caption: 'Consultation documents',
		fieldName: 'draftStatementOfSoundness',
		path: 'draft-stat-soundness',
		section: 'procedural',
		addCy: 'add-draft-statement-of-soundness'
	},
	noticeOfIntentionToCommenceLocalPlan: {
		heading: 'Upload your notice of intention to commence local plan preparation',
		caption: 'Consultation documents',
		fieldName: 'noticeOfIntention',
		path: 'notice-of-intent',
		section: 'consultation',
		addCy: 'add-notice-of-intention-to-commence-local-plan-preparation'
	},
	subsequentWorkTowardsDraftPlan: {
		heading: 'Upload any subsequent work towards a draft plan',
		caption: 'Additional documents',
		fieldName: 'subsequentWorkTowardsADraftPlan',
		path: 'subsequent-work-towards-a-draft-plan',
		section: 'additional',
		addCy: 'add-subsequent-work-towards-a-draft-plan'
	}
} as const satisfies Record<string, Gateway2UploadAnswer>;
