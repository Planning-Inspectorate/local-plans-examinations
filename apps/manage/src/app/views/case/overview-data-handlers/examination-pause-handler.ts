import { ExaminationTabHandler } from './examination-tab-handler.ts';
import { type PageLoadContext } from './overview-page-load-handler.ts';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';

export class ExaminationPauseHandler extends ExaminationTabHandler {
	public async handle(context: PageLoadContext) {
		const { req, res } = context;
		const caseReference = String(req.params.reference);
		const examJourneyUrl = `/case/${encodeURIComponent(caseReference)}/${COMMON_CONSTS.EXAMINATION_JOURNEY_ID}`;
		if (!req.params.question) {
			// Redirect back to the exam page if not answering a question
			res.redirect(examJourneyUrl);
			return;
		}
		return super.handle(context);
	}
}
