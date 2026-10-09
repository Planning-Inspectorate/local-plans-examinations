import { Question } from '@planning-inspectorate/dynamic-forms/src/questions/question.js';
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
		const notes = [];
		for (let i = 0; i < 10; i++) {
			notes.push({
				text: `some text`,
				dateCreated: `some date`,
				createdBy: `some user`
			});
		}
		const formattedAnswer = nunjucks.render(`${this.viewFolder}/notes-summary-list.njk`, {
			notes,
			_csrf: journey._csrf
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
