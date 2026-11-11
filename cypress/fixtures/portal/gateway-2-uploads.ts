type Gateway2UploadAnswer = {
	heading: string;
	caption: string;
	fieldName: string;
	path: string;
	section: string;
	addCy: string;
	guidanceText?: string[];
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
	},
	planContent: {
		heading: 'Upload plan content documents',
		caption: 'Plan content, evidence and background',
		fieldName: 'planContent',
		path: 'plan-content',
		section: 'plan-content-evidence',
		addCy: 'add-plan-content',
		guidanceText: [
			'You should add any documents that will form part of your local plan. These can be in draft form and could include:',
			'vision, aims, objectives, up to 10 outcomes',
			'spatial strategy options or spatial strategy',
			'other plan content',
			'The document name must describe what it is, for example "spatial strategy options 2026 draft".',
			'Upload a file'
		]
	},
	evidenceAndProgress: {
		heading: 'Upload evidence and progress',
		caption: 'Plan content, evidence and background',
		fieldName: 'evidenceAndProgress',
		path: 'evidence-and-progress',
		section: 'plan-content-evidence',
		addCy: 'add-evidence-and-progress',
		guidanceText: [
			'You should add any documents that provide evidence to show the progress of your local plan. There is no need to add every document on this list, just those that are relevant to your local plan. These can be in draft form and could include:',
			'list of evidence documents with completion dates',
			'progress towards setting a housing requirement and evidence such as a housing needs assessment and strategic housing market assessment',
			'progress and evidence towards identifying needs for Traveller accommodation such as an accommodation assessment',
			'progress and evidence towards setting other development needs and supply (like employment or retail)',
			'progress on assessments required by the Habitats Regulations and the Environmental Assessment Regulations',
			'topic papers (up to 5 issues, max 2,000 words each)',
			'site selection approach and evidence',
			'green belt review',
			'evidence related to the matters of soundness to be discussed',
			'The document name must describe what it is, for example "green belt review 2026".',
			'Upload a file'
		]
	}
} as const satisfies Record<string, Gateway2UploadAnswer>;

export const gateway2ApplicationDocuments = {
	procedural: [
		{ document: 'Gateway 2 covering letter', addCy: gateway2UploadAnswers.coveringLetter.addCy },
		{ document: 'Local plan timetable', addCy: gateway2UploadAnswers.localPlanTimetable.addCy },
		{ document: 'Project initiation document', addCy: 'add-project-initiation-document' },
		{ document: 'Draft statement of compliance', addCy: 'add-draft-statement-of-compliance' },
		{ document: 'Draft statement of soundness', addCy: gateway2UploadAnswers.draftStatementOfSoundness.addCy }
	],
	consultation: [
		{
			document: 'Notice of intention to commence local plan preparation',
			addCy: gateway2UploadAnswers.noticeOfIntentionToCommenceLocalPlan.addCy
		},
		{ document: 'Scoping consultation documents', addCy: 'add-scoping-consultation-documents' },
		{
			document: 'Consultation summary of feedback to scoping consultation',
			addCy: 'add-consultation-summary-of-feedback-to-scoping-consultation'
		},
		{
			document: 'Summary of consultation on proposed local plan content and evidence',
			addCy: 'add-summary-of-consultation-on-proposed-local-plan-content-and-evidence-documents'
		},
		{ document: 'Gateway 1 - Self Assessment of Readiness', addCy: 'add-gateway-1-self-assessment' },
		{
			document: 'Consultation on proposed local plan content and evidence documents',
			addCy: 'add-consultation-proposed-content'
		}
	],
	PlanContentEvidenceBackground: [
		{ document: 'Plan content', addCy: gateway2UploadAnswers.planContent.addCy },
		{ document: 'Digital supporting material', addCy: 'add-digital-supporting-material' },
		{ document: 'Evidence and progress', addCy: gateway2UploadAnswers.evidenceAndProgress.addCy },
		{ document: 'Latest policies map', addCy: 'add-latest-policies-map' }
	],
	additional: [
		{
			document: 'Subsequent work towards a draft Plan',
			addCy: gateway2UploadAnswers.subsequentWorkTowardsDraftPlan.addCy
		}
	]
};

export const gateway2SubmittedPlan = {
	reference: 'PLAN-C02',
	title: 'GW2SubmittedNotIssued',
	submittedDate: '12 September 2026',
	coveringLetter: 'test-document.pdf',
	timetableFiles: ['test-document.docx', 'test-document.xlsx']
};
