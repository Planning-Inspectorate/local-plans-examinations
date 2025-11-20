import type { Request, Response } from 'express';
import { clearDataFromSession } from '@planning-inspectorate/dynamic-forms/src/lib/session-answer-store.js';
import { QuestionnaireService } from './core/service.ts';
import { QUESTIONNAIRE_CONFIG } from './core/config.ts';
import type { QuestionnaireAnswers } from './types/types.ts';
import type { PortalService } from '#service';

export const createSaveController = (questionnaireService: QuestionnaireService, portalService: PortalService) => {
	return async (req: Request, res: Response) => {
		try {
			const answers = res.locals.journeyResponse?.answers as QuestionnaireAnswers;
			const journey = res.locals.journey;

			portalService.logger.info(
				`Processing questionnaire save request - journeyComplete: ${journey?.isComplete()}, answerCount: ${answers ? Object.keys(answers).length : 0}`
			);

			if (!journey?.isComplete()) {
				portalService.logger.warn('Journey not complete, redirecting to check answers');
				return res.redirect('/questionnaire/check-your-answers');
			}

			if (!answers || Object.keys(answers).length === 0) {
				portalService.logger.warn('No answers found, redirecting to questionnaire start');
				return res.redirect('/questionnaire');
			}

			portalService.logger.info('Proceeding with questionnaire submission save');
			const submission = await questionnaireService.saveSubmission(answers);
			await questionnaireService.sendNotification(submission);

			questionnaireService.storeSubmissionInSession(req, submission);
			clearDataFromSession({ req, journeyId: QUESTIONNAIRE_CONFIG.id });

			portalService.logger.info('Questionnaire saved successfully, redirecting to success page');
			res.redirect('/questionnaire/success');
		} catch (error) {
			portalService.logger.error(
				`Error saving questionnaire submission: ${error instanceof Error ? error.message : String(error)}`
			);
			questionnaireService.setErrorInSession(
				req,
				'There was a problem submitting your questionnaire. Please try again.'
			);
			res.redirect('/questionnaire/check-your-answers');
		}
	};
};
