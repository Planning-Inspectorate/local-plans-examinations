import { SmartLookupPage } from '../base/index.ts';

export class CaseOverviewGateway3AssessorPage extends SmartLookupPage {
	constructor() {
		super(/^\/case\/.+\/overview\/contacts\/assessor-gateway-3$/, 'assessorGateway3', 'Who is the Gateway 3 assessor?');
	}

	enterAssessorName(assessorName: string) {
		this.enterLookupAnswer(assessorName);
	}
}

export const caseOverviewGateway3AssessorPage = new CaseOverviewGateway3AssessorPage();
