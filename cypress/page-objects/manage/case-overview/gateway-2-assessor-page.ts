import { SmartLookupPage } from '../base/index.ts';

export class CaseOverviewGateway2AssessorPage extends SmartLookupPage {
	constructor() {
		super(/^\/case\/.+\/overview\/contacts\/assessor-gateway-2$/, 'assessorName', 'Who is the Gateway 2 assessor?');
	}

	enterAssessorName(assessorName: string) {
		this.enterLookupAnswer(assessorName);
	}
}

export const caseOverviewGateway2AssessorPage = new CaseOverviewGateway2AssessorPage();
