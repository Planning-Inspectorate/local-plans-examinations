import { gateway2DateAnswers } from '../../../fixtures/manage/gateway-2.ts';
import { DateQuestionPage } from '../base/index.ts';

const gateway2QuestionPath = (path: string) => new RegExp(`^/case/.+/gateway-2/gateway-2/${path}$`);

export const gateway2EstimatedDatePage = new DateQuestionPage(
	gateway2QuestionPath(gateway2DateAnswers.gateway2EstimatedDate.path),
	gateway2DateAnswers.gateway2EstimatedDate.fieldName,
	gateway2DateAnswers.gateway2EstimatedDate.heading
);

export const gateway2ActualDatePage = new DateQuestionPage(
	gateway2QuestionPath(gateway2DateAnswers.gateway2ActualDate.path),
	gateway2DateAnswers.gateway2ActualDate.fieldName,
	gateway2DateAnswers.gateway2ActualDate.heading
);
