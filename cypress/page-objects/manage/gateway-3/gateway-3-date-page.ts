import { gateway3DateAnswers } from '../../../fixtures/manage/gateway-3.ts';
import { DateQuestionPage } from '../base/index.ts';

const gateway3QuestionPath = (path: string) => new RegExp(`^/case/.+/gateway-3/gateway-3/${path}$`);

export const gateway3EstimatedDatePage = new DateQuestionPage(
	gateway3QuestionPath(gateway3DateAnswers.gateway3EstimatedDate.path),
	gateway3DateAnswers.gateway3EstimatedDate.fieldName,
	gateway3DateAnswers.gateway3EstimatedDate.heading
);

export const gateway3ActualDatePage = new DateQuestionPage(
	gateway3QuestionPath(gateway3DateAnswers.gateway3ActualDate.path),
	gateway3DateAnswers.gateway3ActualDate.fieldName,
	gateway3DateAnswers.gateway3ActualDate.heading
);

export const gateway3AssessorDateAppointmentPage = new DateQuestionPage(
	gateway3QuestionPath(gateway3DateAnswers.gateway3AssessorDateAppointment.path),
	gateway3DateAnswers.gateway3AssessorDateAppointment.fieldName,
	gateway3DateAnswers.gateway3AssessorDateAppointment.heading
);

export const gateway3CompletionDatePage = new DateQuestionPage(
	gateway3QuestionPath(gateway3DateAnswers.gateway3CompletionDate.path),
	gateway3DateAnswers.gateway3CompletionDate.fieldName,
	gateway3DateAnswers.gateway3CompletionDate.heading
);
