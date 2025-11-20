/**
 * Questionnaire business service
 */
import type { PortalService } from '#service';
import type { QuestionnaireAnswers, QuestionnaireSubmission } from '../types/types.ts';
import type { PrismaQuestionnaireRepository } from '../repository.ts';

export class QuestionnaireService {
	private readonly portalService: PortalService;
	private repository: PrismaQuestionnaireRepository;

	constructor(portalService: PortalService, repository: PrismaQuestionnaireRepository) {
		this.portalService = portalService;
		this.repository = repository;
	}

	async saveSubmission(answers: QuestionnaireAnswers): Promise<QuestionnaireSubmission> {
		const result = await this.repository.save(answers);

		const submission: QuestionnaireSubmission = {
			id: result.id,
			reference: result.id, // Use CUID as reference
			answers,
			submittedAt: result.createdAt
		};

		this.portalService.logger.info(`Questionnaire saved to database - submissionId: ${submission.id}`);
		return submission;
	}

	async sendNotification(submission: QuestionnaireSubmission): Promise<void> {
		// TODO: Replace with actual notification implementation
		this.portalService.logger.info(
			{ reference: submission.reference, email: submission.answers.email },
			'Sending questionnaire notification'
		);
		this.portalService.logger.info(`TODO: Send email notification - reference: ${submission.reference}`);
	}

	storeSubmissionInSession(req: any, submission: QuestionnaireSubmission): void {
		if (!req.session.questionnaires) req.session.questionnaires = {};
		req.session.questionnaires.lastReference = submission.reference;
		req.session.questionnaires.submitted = true;
	}

	getSubmissionFromSession(req: any): { reference?: string; submitted?: boolean; error?: string } {
		const sessionData = req.session.questionnaires || {};
		return {
			reference: sessionData.lastReference,
			submitted: sessionData.submitted,
			error: sessionData.error
		};
	}

	clearSubmissionFromSession(req: any): void {
		if (req.session.questionnaires) {
			delete req.session.questionnaires.lastReference;
			delete req.session.questionnaires.submitted;
			delete req.session.questionnaires.error;
		}
	}

	setErrorInSession(req: any, error: string): void {
		if (!req.session.questionnaires) req.session.questionnaires = {};
		req.session.questionnaires.error = error;
	}
}
