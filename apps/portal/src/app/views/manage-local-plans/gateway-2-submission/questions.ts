import { createQuestions, questionClasses, type Question } from '@planning-inspectorate/dynamic-forms';
import {
	CUSTOM_COMPONENT_CLASSES,
	type CrownQuestionProps
} from '@pins/local-plans-lib/forms/custom-components/index.ts';
import { type FileUploaderQuestionProps } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import { createFileUploadQuestion } from './utils.ts';

const allQuestionClasses = {
	...questionClasses,
	...CUSTOM_COMPONENT_CLASSES
};

export const CHECK_ANSWERS_REDIRECT_QUERY = 'checkAnswersRedirect';
export const CHECK_ANSWERS_REDIRECTS = {
	CHECK_YOUR_ANSWERS: 'check-your-answers',
	NEXT_QUESTION: 'next-question'
} as const;

export type CheckAnswersRedirect = (typeof CHECK_ANSWERS_REDIRECTS)[keyof typeof CHECK_ANSWERS_REDIRECTS];

export const gateway2CoverLetterQuestion: FileUploaderQuestionProps = createFileUploadQuestion({
	title: 'Gateway 2 covering letter',
	question: 'Upload your Gateway 2 covering letter',
	fieldName: 'gateway2CoverLetter',
	url: 'covering-letter',
	text: {
		caption: 'Procedural documents'
	}
});

export const localPlanTimetableQuestion: FileUploaderQuestionProps = createFileUploadQuestion({
	title: 'Local plan timetable',
	question: 'Upload local plan timetable',
	fieldName: 'localPlanTimetable',
	url: 'local-plan-timetable',
	text: {
		caption: 'Procedural documents'
	}
});

export const projectInitiationDocumentQuestion: FileUploaderQuestionProps = createFileUploadQuestion({
	title: 'Project initiation document',
	question: 'Upload project initiation document',
	fieldName: 'projectInitiationDocument',
	url: 'project-initiation-document',
	text: {
		caption: 'Procedural documents'
	}
});

export const draftStatementOfComplianceQuestion: FileUploaderQuestionProps = createFileUploadQuestion({
	title: 'Draft statement of compliance',
	question: 'Upload draft statement of compliance',
	fieldName: 'draftStatementOfCompliance',
	url: 'draft-stat-compliance',
	text: {
		caption: 'Procedural documents'
	}
});

export const noticeOfIntentionQuestion: FileUploaderQuestionProps = createFileUploadQuestion({
	title: 'Notice of intention to commence local plan preparation',
	question: 'Upload your notice of intention to commence local plan preparation',
	fieldName: 'noticeOfIntention',
	url: 'notice-of-intent',
	text: {
		caption: 'Consultation documents'
	}
});

export const gateway1SelfAssessmentQuestion: FileUploaderQuestionProps = createFileUploadQuestion({
	title: 'Gateway 1 - Self Assessment of Readiness',
	question: 'Upload your Gateway 1 - Self Assessment of Readiness',
	fieldName: 'gateway1SelfAssessment',
	url: 'g1-self-assess',
	text: {
		caption: 'Consultation documents'
	}
});

export const consultationOnProposedContentQuestion: FileUploaderQuestionProps = createFileUploadQuestion({
	title: 'Consultation on proposed local plan content and evidence documents',
	question: 'Upload your Consultation on proposed local plan content and evidence documents',
	fieldName: 'consultationOnProposedContent',
	url: 'cons-of-proposed',
	text: {
		caption: 'Consultation documents'
	}
});

export const draftStatementOfSoundnessQuestion: FileUploaderQuestionProps = createFileUploadQuestion({
	title: 'Draft statement of soundness',
	question: 'Upload your draft statement of soundness',
	fieldName: 'draftStatementOfSoundness',
	url: 'draft-stat-soundness',
	text: {
		caption: 'Procedural documents'
	}
});

export const scopingConsultationDocumentsQuestion: FileUploaderQuestionProps = createFileUploadQuestion({
	title: 'Scoping consultation documents',
	question: 'Upload your scoping consultation documents',
	fieldName: 'scopingConsultationDocuments',
	url: 'scoping-cons',
	text: {
		caption: 'Consultation documents'
	}
});

export const consultationSummaryFeedbackScopingQuestion: FileUploaderQuestionProps = createFileUploadQuestion({
	title: 'Consultation summary of feedback to scoping consultation',
	question: 'Upload consultation summary of feedback to scoping consultation documents',
	fieldName: 'consultationSummaryFeedbackScoping',
	url: 'cons-summ',
	text: {
		caption: 'Consultation documents'
	}
});

export const consultationSummaryProposedContentQuestion: FileUploaderQuestionProps = createFileUploadQuestion({
	title: 'Summary of consultation for proposed local plan content and evidence',
	question: 'Upload your summary of consultation for proposed local plan content and evidence',
	fieldName: 'consultationSummaryProposedContent',
	url: 'summary-of-consultation',
	text: {
		caption: 'Consultation documents'
	}
});

export const subsequentWorkTowardsADraftPlan: FileUploaderQuestionProps = createFileUploadQuestion({
	title: 'Subsequent work towards a draft Plan',
	question: 'Upload any subsequent work towards a draft plan',
	fieldName: 'subsequentWorkTowardsADraftPlan',
	url: 'subsequent-work-towards-a-draft-plan',
	text: {
		caption: 'Additional documents'
	}
});

export const gateway2FileUploadQuestions = {
	gateway2CoverLetter: gateway2CoverLetterQuestion,
	localPlanTimetable: localPlanTimetableQuestion,
	projectInitiationDocument: projectInitiationDocumentQuestion,
	draftStatementOfCompliance: draftStatementOfComplianceQuestion,
	noticeOfIntention: noticeOfIntentionQuestion,
	gateway1SelfAssessment: gateway1SelfAssessmentQuestion,
	consultationOnProposedContent: consultationOnProposedContentQuestion,
	draftStatementOfSoundness: draftStatementOfSoundnessQuestion,
	scopingConsultationDocuments: scopingConsultationDocumentsQuestion,
	consultationSummaryFeedbackScoping: consultationSummaryFeedbackScopingQuestion,
	consultationSummaryProposedContent: consultationSummaryProposedContentQuestion,
	subsequentWorkTowardsADraftPlan: subsequentWorkTowardsADraftPlan
} satisfies Record<string, CrownQuestionProps>;

export const questions = createQuestions(
	gateway2FileUploadQuestions,
	allQuestionClasses,
	{},
	{
		notStartedText: 'Not added',
		answerActionText: 'Add'
	}
) as Record<string, Question>;

const checkAnswersRedirects: Partial<Record<keyof typeof gateway2FileUploadQuestions, CheckAnswersRedirect>> = {};

// Adds check answers redirect behaviour to configured questions.
for (const [questionName, redirect] of Object.entries(checkAnswersRedirects)) {
	if (!redirect) {
		continue;
	}

	addCheckAnswersRedirectToAction(questions[questionName], redirect);
}

// Updates a question action so it includes the check answers redirect query.
function addCheckAnswersRedirectToAction(question: Question, redirect: CheckAnswersRedirect) {
	const getAction = question.getAction.bind(question);

	question.getAction = (...params: Parameters<Question['getAction']>): ReturnType<Question['getAction']> => {
		const action = getAction(...params);
		if (!action || Array.isArray(action)) {
			return action;
		}

		return {
			...action,
			href: appendQueryParam(action.href, CHECK_ANSWERS_REDIRECT_QUERY, redirect)
		};
	};
}

// Appends a query parameter to a URL.
// Example format: /plan-title?checkAnswersRedirect=check-your-answers.
export function appendQueryParam(url: string, key: string, value: string) {
	const separator = url.includes('?') ? '&' : '?';
	return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}
