import {
	factCheckActualDate,
	factCheckDateReceivedFromInspector,
	factCheckDueDate,
	factCheckReceivedBackFromLpaDate,
	finalReportIssueDate,
	letterIssueDate,
	letterSentToMHCLGDate,
	estimatedSubmissionDate,
	actualSubmissionDate,
	examiningInspectorAppointmentDate,
	QADateAnswers,
	planPauseStartDate
} from '../../../fixtures/manage/examination.ts';
import { DateQuestionPage } from '../base/index.ts';

const lettersQuestionPath = (path: string) => new RegExp(`^/case/.+/examination/letters/${path}$`);
const factCheckQuestionPath = (path: string) => new RegExp(`^/case/.+/examination/fact-check/${path}$`);
const examinationQuestionPath = (path: string) => new RegExp(`^/case/.+/examination/examination/${path}$`);
const inspectorQuestionPath = (path: string) => new RegExp(`^/case/.+/examination/inspectors/${path}$`);
const QADateQuestionPath = (path: string) => new RegExp(`^/case/.+/examination/QA/${path}$`);
const importantDatesQuestionPath = (path: string) => new RegExp(`^/case/.+/examination/important-dates/${path}$`);

export const estimatedSubmissionDatePage = new DateQuestionPage(
	examinationQuestionPath(estimatedSubmissionDate.path),
	estimatedSubmissionDate.fieldName,
	estimatedSubmissionDate.heading
);

export const actualSubmissionDatePage = new DateQuestionPage(
	examinationQuestionPath(actualSubmissionDate.path),
	actualSubmissionDate.fieldName,
	actualSubmissionDate.heading
);

export const examiningInspectorAppointmentDatePage = new DateQuestionPage(
	inspectorQuestionPath(examiningInspectorAppointmentDate.path),
	examiningInspectorAppointmentDate.fieldName,
	examiningInspectorAppointmentDate.heading
);

export const letterSentToMHCLGDatePage = new DateQuestionPage(
	lettersQuestionPath(letterSentToMHCLGDate.path),
	letterSentToMHCLGDate.fieldName,
	letterSentToMHCLGDate.heading
);

export const letterIssueDatePage = new DateQuestionPage(
	lettersQuestionPath(letterIssueDate.path),
	letterIssueDate.fieldName,
	letterIssueDate.heading
);

export const factCheckDateReceivedFromInspectorPage = new DateQuestionPage(
	factCheckQuestionPath(factCheckDateReceivedFromInspector.path),
	factCheckDateReceivedFromInspector.fieldName,
	factCheckDateReceivedFromInspector.heading
);

export const factCheckDueDatePage = new DateQuestionPage(
	factCheckQuestionPath(factCheckDueDate.path),
	factCheckDueDate.fieldName,
	factCheckDueDate.heading
);

export const factCheckActualDatePage = new DateQuestionPage(
	factCheckQuestionPath(factCheckActualDate.path),
	factCheckActualDate.fieldName,
	factCheckActualDate.heading
);

export const factCheckReceivedBackFromLpaDatePage = new DateQuestionPage(
	factCheckQuestionPath(factCheckReceivedBackFromLpaDate.path),
	factCheckReceivedBackFromLpaDate.fieldName,
	factCheckReceivedBackFromLpaDate.heading
);

export const finalReportIssueDatePage = new DateQuestionPage(
	factCheckQuestionPath(finalReportIssueDate.path),
	finalReportIssueDate.fieldName,
	finalReportIssueDate.heading
);

export const QADatePage = new DateQuestionPage(
	QADateQuestionPath(QADateAnswers.QADate.path),
	QADateAnswers.QADate.fieldName,
	QADateAnswers.QADate.heading
);

export const sentToPanelDatePage = new DateQuestionPage(
	QADateQuestionPath(QADateAnswers.sentToPanelDate.path),
	QADateAnswers.sentToPanelDate.fieldName,
	QADateAnswers.sentToPanelDate.heading
);

export const QAPanelResponseDatePage = new DateQuestionPage(
	QADateQuestionPath(QADateAnswers.QAPanelResponseDate.path),
	QADateAnswers.QAPanelResponseDate.fieldName,
	QADateAnswers.QAPanelResponseDate.heading
);

export const planPauseStartDatePage = new DateQuestionPage(
	importantDatesQuestionPath(planPauseStartDate.path),
	planPauseStartDate.fieldName,
	planPauseStartDate.heading
);
