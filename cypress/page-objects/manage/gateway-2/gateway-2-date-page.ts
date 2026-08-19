import { gateway2DateAnswers } from '../../../fixtures/manage/gateway-2.ts';
import { DateQuestionPage } from '../base/index.ts';

const gateway2QuestionPath = (path: string) => new RegExp(`^/case/.+/gateway-2/gateway-2/${path}$`);

export const gateway2ExpectedDatePage = new DateQuestionPage(
	gateway2QuestionPath(gateway2DateAnswers.gateway2ExpectedDate.path),
	gateway2DateAnswers.gateway2ExpectedDate.fieldName,
	gateway2DateAnswers.gateway2ExpectedDate.heading
);

export const gateway2ActualDatePage = new DateQuestionPage(
	gateway2QuestionPath(gateway2DateAnswers.gateway2ActualDate.path),
	gateway2DateAnswers.gateway2ActualDate.fieldName,
	gateway2DateAnswers.gateway2ActualDate.heading
);

export const gateway2ValidDatePage = new DateQuestionPage(
	gateway2QuestionPath(gateway2DateAnswers.gateway2ValidDate.path),
	gateway2DateAnswers.gateway2ValidDate.fieldName,
	gateway2DateAnswers.gateway2ValidDate.heading
);

export const assessorDateOfAppointmentPage = new DateQuestionPage(
	gateway2QuestionPath(gateway2DateAnswers.assessorDateOfAppointment.path),
	gateway2DateAnswers.assessorDateOfAppointment.fieldName,
	gateway2DateAnswers.assessorDateOfAppointment.heading
);

export const workshopDatePage = new DateQuestionPage(
	gateway2QuestionPath(gateway2DateAnswers.workshopDate.path),
	gateway2DateAnswers.workshopDate.fieldName,
	gateway2DateAnswers.workshopDate.heading
);

export const reportIssuedDatePage = new DateQuestionPage(
	gateway2QuestionPath(gateway2DateAnswers.reportIssuedDate.path),
	gateway2DateAnswers.reportIssuedDate.fieldName,
	gateway2DateAnswers.reportIssuedDate.heading
);

export const reportPublishedByLPADatePage = new DateQuestionPage(
	gateway2QuestionPath(gateway2DateAnswers.reportPublishedDate.path),
	gateway2DateAnswers.reportPublishedDate.fieldName,
	gateway2DateAnswers.reportPublishedDate.heading
);
