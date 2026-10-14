import { Question } from '@planning-inspectorate/dynamic-forms/src/questions/question.js';
import { formatDateToString } from '../../../util/date.ts';
import nunjucks from 'nunjucks';

export default class CustomNoteQuestion extends Question {
	constructor(params: any) {
		super({
			...params,
			viewFolder: 'views/layouts/custom-note-input'
		});
	}
	formatAnswerForSummary(sectionSegment: string, journey: any, answer: { id: string; [k: string]: string }) {
		console.log(`temp log to allow a commit while logic is still TBC ${answer}`);
		const key = this.title ?? this.question;
		const notes: {
			text: string;
			createdTime: Date;
			createdBy: string;
			caseId: string;
		}[] = journey.response.answers.notes ?? [];
		const cleanNotes = notes
			.sort((a, b) => b.createdTime.getTime() - a.createdTime.getTime())
			.map((note) => ({
				text: note.text,
				createdTime: formatDateToString(note.createdTime, true),
				createdBy: note.createdBy
			}));

		const formattedAnswer = nunjucks.render(`${this.viewFolder}/notes-summary-list.njk`, {
			reference: journey.response.answers.reference,
			notes: cleanNotes,
			_csrf: journey._csrf, // This needed because the csrf token is not propagated from the case-overview
			errorSummary: journey.response.error?.errorSummary // This needed because the message is not propagated from the case-overview
		});
		return [
			{
				key: key,
				value: formattedAnswer,
				action: undefined
			}
		];
	}
}
