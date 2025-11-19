import type { Request, Response } from 'express';
import { clearDataFromSession } from '@planning-inspectorate/dynamic-forms/src/lib/session-answer-store.js';
import { QuestionnaireService } from './core/service.ts';
import { QUESTIONNAIRE_CONFIG } from './core/config.ts';
import type { QuestionnaireAnswers } from './types/types.ts';

export const createSaveController = (questionnaireService: QuestionnaireService) => {
	return async (req: Request, res: Response) => {
		try {
			const answers = res.locals.journeyResponse?.answers as QuestionnaireAnswers;
			const journey = res.locals.journey;

			console.log('Save controller - Journey complete:', journey?.isComplete());
			console.log('Save controller - Answers:', answers);
			console.log('Save controller - Answer count:', answers ? Object.keys(answers).length : 0);

			if (!journey?.isComplete()) {
				console.log('Journey not complete, redirecting to check-your-answers');
				return res.redirect('/questionnaire/check-your-answers');
			}

			if (!answers || Object.keys(answers).length === 0) {
				console.log('No answers found, redirecting to start');
				return res.redirect('/questionnaire');
			}

			console.log('Proceeding with save...');
			const submission = await questionnaireService.saveSubmission(answers);
			await questionnaireService.sendNotification(submission);

			questionnaireService.storeSubmissionInSession(req, submission);
			clearDataFromSession({ req, journeyId: QUESTIONNAIRE_CONFIG.id });

			console.log('Redirecting to success page');
			res.redirect('/questionnaire/success');
		} catch (error) {
			console.log('Save controller error:', error);
			questionnaireService.setErrorInSession(
				req,
				'There was a problem submitting your questionnaire. Please try again.'
			);
			res.redirect('/questionnaire/check-your-answers');
		}
	};
};
