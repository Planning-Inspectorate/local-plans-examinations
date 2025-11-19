/**
 * Questionnaire business service
 */
import type { PortalService } from '#service';
import type { QuestionnaireAnswers, QuestionnaireSubmission } from '../types/types.ts';

export class QuestionnaireService {
	private readonly portalService: PortalService;

	constructor(portalService: PortalService) {
		this.portalService = portalService;
	}

	async generateReference(): Promise<string> {
		const timestamp = Date.now();
		const random = Math.random().toString(36).substr(2, 5).toUpperCase();
		const reference = `Q-${timestamp}-${random}`;

		this.portalService.logger.info({ reference }, 'Generated questionnaire reference');
		return reference;
	}

	async saveSubmission(answers: QuestionnaireAnswers): Promise<QuestionnaireSubmission> {
		const reference = await this.generateReference();
		const submission: QuestionnaireSubmission = {
			id: `placeholder-${Date.now()}`,
			reference,
			answers,
			submittedAt: new Date()
		};

		// TODO: Replace with actual Prisma implementation
		this.portalService.logger.info({ submission }, 'Saving questionnaire submission');
		console.log('TODO: Save to database:', submission);

		return submission;
	}

	async sendNotification(submission: QuestionnaireSubmission): Promise<void> {
		// TODO: Replace with actual notification implementation
		this.portalService.logger.info(
			{ reference: submission.reference, email: submission.answers.email },
			'Sending questionnaire notification'
		);
		console.log('TODO: Send email notification:', submission.reference);
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
