import {
	factCheckActualDate,
	factCheckDateReceivedFromInspector,
	factCheckDueDate,
	factCheckReceivedBackFromLpaDate,
	finalReportIssueDate,
	letterIssueDate,
	letterSentToMHCLGDate
} from '../../../fixtures/manage/examination.ts';
import { DateQuestionPage } from '../base/index.ts';

const lettersQuestionPath = (path: string) => new RegExp(`^/case/.+/examination/letters/${path}$`);
const factCheckQuestionPath = (path: string) => new RegExp(`^/case/.+/examination/fact-check/${path}$`);

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
