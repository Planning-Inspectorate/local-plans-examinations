import { letterIssueDate, letterSentToMHCLGDate } from '../../../fixtures/manage/examination.ts';
import { DateQuestionPage } from '../base/index.ts';

const examinationQuestionPath = (path: string) => new RegExp(`^/case/.+/examination/letters/${path}$`);

export const letterSentToMHCLGDatePage = new DateQuestionPage(
	examinationQuestionPath(letterSentToMHCLGDate.path),
	letterSentToMHCLGDate.fieldName,
	letterSentToMHCLGDate.heading
);

export const letterIssueDatePage = new DateQuestionPage(
	examinationQuestionPath(letterIssueDate.path),
	letterIssueDate.fieldName,
	letterIssueDate.heading
);
