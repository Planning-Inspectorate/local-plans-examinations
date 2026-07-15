import { gateway1DateAnswers } from '../../../fixtures/manage/gateway-1.ts';
import { DateQuestionPage } from '../base/index.ts';

const gateway1QuestionPath = (path: string) => new RegExp(`^/case/.+/gateway-1/gateway-1/${path}$`);

export const noticeOfIntentionPublishDatePage = new DateQuestionPage(
	gateway1QuestionPath(gateway1DateAnswers.noticeOfIntention.path),
	gateway1DateAnswers.noticeOfIntention.fieldName,
	gateway1DateAnswers.noticeOfIntention.heading
);

export const gateway1EstimatedDatePage = new DateQuestionPage(
	gateway1QuestionPath(gateway1DateAnswers.estimatedGateway1Date.path),
	gateway1DateAnswers.estimatedGateway1Date.fieldName,
	gateway1DateAnswers.estimatedGateway1Date.heading
);
