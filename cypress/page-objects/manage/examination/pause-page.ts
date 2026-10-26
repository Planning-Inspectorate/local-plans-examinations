import { DateQuestionPage, SingleLineInputPage } from '../base/index.ts';

export const examinationPausePages = (pauseNumber = 1) => {
	const path = (question: string) =>
		new RegExp(`^/case/.+/examination-pause/pause-examination/${question}-${pauseNumber}$`);

	return {
		startDate: new DateQuestionPage(
			path('examination-pause-start-date'),
			`planPauseDate-${pauseNumber}`,
			'When is the examination paused from?'
		),
		details: new SingleLineInputPage(
			path('examination-pause-details'),
			`planPauseStartDetails-${pauseNumber}`,
			'Pause details'
		),
		restartDate: new DateQuestionPage(
			path('examination-pause-end-date'),
			`planPauseEndDate-${pauseNumber}`,
			'What is the examination restart date?'
		),
		restartDetails: new SingleLineInputPage(
			path('examination-pause-restart-details'),
			`planPauseEndDetails-${pauseNumber}`,
			'Restart details'
		)
	};
};
