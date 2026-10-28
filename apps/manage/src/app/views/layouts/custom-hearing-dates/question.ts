import { Question } from '@planning-inspectorate/dynamic-forms/src/questions/question.js';
import { formatDateToString } from '../../../util/date.ts';

/** Summary-only question: one row listing every workshop date, with a View link to the Gateway 2 tab. */
export default class CustomHearingDatesQuestion extends Question {
	constructor({ ...params }) {
		super({
			...params,
			viewFolder: 'views/layouts/custom-hearing-dates',
			title: params.title,
			question: params.question,
			fieldName: params.fieldName
		});
	}

	formatAnswerForSummary(_sectionSegment: string, journey: any, answer: unknown) {
		const hearings = Array.isArray(answer) ? answer : [];
		const dates = hearings
			.map((hearing) => hearing.hearingDate)
			.filter(Boolean)
			.map((date) => formatDateToString(new Date(date)));
		const gateway2Url = journey.makeBaseUrl().replace(/\/[^/]+$/, '/examination');

		return [
			{
				key: this.title,
				value: dates.length ? dates.join('<br>') : this.notStartedText,
				action: { href: gateway2Url, text: 'View', visuallyHiddenText: this.title }
			}
		];
	}
}
