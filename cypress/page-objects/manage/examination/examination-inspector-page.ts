import { SmartLookupPage } from '../base/smart-lookup-page.ts';
import { examiningInspector1, examiningInspector2, examiningInspector3 } from '../../../fixtures/manage/examination.ts';

const inspectorQuestionPath = (path: string) => new RegExp(`^/case/.+/examination/inspectors/${path}$`);

export const examiningInspector1Page = new SmartLookupPage(
	inspectorQuestionPath(examiningInspector1.path),
	examiningInspector1.fieldName,
	examiningInspector1.heading
);

export const examiningInspector2Page = new SmartLookupPage(
	inspectorQuestionPath(examiningInspector2.path),
	examiningInspector2.fieldName,
	examiningInspector2.heading
);

export const examiningInspector3Page = new SmartLookupPage(
	inspectorQuestionPath(examiningInspector3.path),
	examiningInspector3.fieldName,
	examiningInspector3.heading
);
