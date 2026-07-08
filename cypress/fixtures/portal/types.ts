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
	currentStage: string;
	status: string;
	leadLpa: string;
	linkedLpa: string;
	dates: PlanDetailsDates;
}
