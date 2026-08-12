import { SmartLookupPage } from '../base/index.ts';
import { QAInspectorsAnswers } from '../../../fixtures/manage/examination.ts';

const QAQuestionPath = (path: string) => new RegExp(`^/case/.+/examination/QA/${path}$`);

export const examinationQAInspector1Page = new SmartLookupPage(
	QAQuestionPath(QAInspectorsAnswers.QAInspector1.path),
	QAInspectorsAnswers.QAInspector1.fieldName,
	QAInspectorsAnswers.QAInspector1.heading
);

export const examinationQAInspector2Page = new SmartLookupPage(
	QAQuestionPath(QAInspectorsAnswers.QAInspector2.path),
	QAInspectorsAnswers.QAInspector2.fieldName,
	QAInspectorsAnswers.QAInspector2.heading
);

export const examinationQAInspector3Page = new SmartLookupPage(
	QAQuestionPath(QAInspectorsAnswers.QAInspector3.path),
	QAInspectorsAnswers.QAInspector3.fieldName,
	QAInspectorsAnswers.QAInspector3.heading
);
