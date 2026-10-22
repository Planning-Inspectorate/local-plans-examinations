import { ExaminationTabHandler } from './examination-tab-handler.ts';
import { type PageLoadContext } from './overview-page-load-handler.ts';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';
import { sortByDateColumn } from '#util/util.ts';
import type { PlanPauseHistory } from '@pins/local-plans-database/src/client/client.ts';

export class ExaminationPauseHandler extends ExaminationTabHandler {
	public async handle(context: PageLoadContext) {
		const { req, res, service } = context;
		const caseReference = String(req.params.reference);
		const examJourneyUrl = `/case/${encodeURIComponent(caseReference)}/${COMMON_CONSTS.EXAMINATION_JOURNEY_ID}`;
		if (!req.params.question) {
			// Redirect back to the exam page if not answering a question
			res.redirect(examJourneyUrl);
			return;
		}
		const question = String(req.params.question);
		if (question.startsWith('examination-pause-start-date-')) {
			// If someone manually switched to this url, check that are allowed to be here, and redirect if not
			// A new pause can only be created if the previous pause has been completeley filled in
			const examData = await service.db.case.findUnique({
				include: {
					examinationInfo: {
						include: {
							planPauseHistory: true
						}
					}
				},
				where: {
					reference: caseReference
				}
			});
			const pauses = examData?.examinationInfo?.planPauseHistory ? examData?.examinationInfo?.planPauseHistory : [];
			if (pauses) {
				const pauseId = parseInt(String(question.split('-').at(-1)));
				if (!pauseId) {
					throw Error(`Expect a pauseid to be included for question '${question}' but it could not be extracted`);
				}
				const sortedPauses = sortByDateColumn(pauses, 'createdAt') as PlanPauseHistory[];
				const previousPause = sortedPauses.at(pauseId - 1);
				if (previousPause && !previousPause.planPauseEndDate) {
					res.redirect(examJourneyUrl);
					return;
				}
			}
		}
		return super.handle(context);
	}
}
