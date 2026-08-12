import { SmartLookupPage } from '../base/smart-lookup-page.ts';
import { examiningInspector1, examiningInspector2, examiningInspector3 } from '../../../fixtures/manage/examination.ts';

const inspectorQuestionPath = (path: string) => new RegExp(`^/case/.+/examination/inspectors/${path}$`);

export class ExaminationInspectorPage extends SmartLookupPage {
	constructor(fieldName: string, path: string, heading: string) {
		super(inspectorQuestionPath(path), fieldName, heading);
	}

	enterInspectorName(inspectorInput: string) {
		this.enterLookupAnswer(inspectorInput);
	}

	inspectorNamePopulated(item: string) {
		this.verifyLookupAnswer(item);
	}

	clearInspectorNameField() {
		this.clearLookupAnswer();
	}
}

export const examiningInspector1Page = new ExaminationInspectorPage(
	examiningInspector1.fieldName,
	examiningInspector1.path,
	examiningInspector1.heading
);

export const examiningInspector2Page = new ExaminationInspectorPage(
	examiningInspector2.fieldName,
	examiningInspector2.path,
	examiningInspector2.heading
);

export const examiningInspector3Page = new ExaminationInspectorPage(
	examiningInspector3.fieldName,
	examiningInspector3.path,
	examiningInspector3.heading
);
