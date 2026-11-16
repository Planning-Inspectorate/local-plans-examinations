export interface PlanDetailsDates {
	gateway1: string;
	gateway2: string;
	gateway3: string;
	examination: string;
}

export interface PlanDetailsFixture {
	reference: string;
	urlReference: string;
	title: string;
	type: string;
	currentStage: string;
	currentStage2: string;
	currentStage3: string;
	readyToStart: string;
	inProgress: string;
	underReview: string;
	resubmissionRequired: string;
	submitted: string;
	inExamination: string;
	reportIssued: string;
	planAdopted: string;
	leadLpa: string;
	linkedLpa: string;
	dates: PlanDetailsDates;
}

export interface Gateway2ReportIssuedFixture extends PlanDetailsFixture {
	completed: string;
	submittedDate: string;
	report: {
		fileName: string;
		sharedDate: string;
	};
}
