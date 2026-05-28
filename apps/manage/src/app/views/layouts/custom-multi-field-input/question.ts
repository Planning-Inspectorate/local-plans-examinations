import { Question } from '@planning-inspectorate/dynamic-forms/src/questions/question.js';
import escape from 'escape-html';
import { nl2br } from '@planning-inspectorate/dynamic-forms';
import { yesNoToBoolean } from '@planning-inspectorate/dynamic-forms';
import type { Journey, QuestionViewModel } from '@planning-inspectorate/dynamic-forms';

interface BaseField {
	fieldName: string;
	formatJoinString?: string;
	formatPrefix?: string;
	formatTextFunction?: (value: string) => string;
}

interface Affix {
	text: string;
	classes?: string;
}

interface InputField extends BaseField {
	type: 'single-line-input';
	label: string;
	attributes?: Record<string, string>;
	autocomplete?: string;
	suffix?: Affix;
	prefix?: Affix;
}

interface RadioField extends BaseField {
	type: 'radio';
	label?: string;
	legend?: string;
	options: Array<{ text: string; value: string; attributes?: Record<string, string> }>;
}

interface HiddenField extends BaseField {
	type: 'hidden';
	value: string;
}

interface BooleanFieldInput extends BaseField {
	type: 'boolean';
	question: string;
	hint?: string;
	options?: Array<{ text: string; value: string }>;
}

interface DateField extends BaseField {
	type: 'date';
	day: string;
	month: string;
	year: string;
	attributes?: Record<string, string>;
}

export const HIDDEN_TYPE = 'hidden';

export default class CustomMultiFieldInputQuestion extends Question {
	inputAttributes: Record<string, string>;
	inputFields: (InputField | RadioField | HiddenField | BooleanFieldInput | DateField)[];
	label: string;

	constructor({ label = '', inputAttributes = {}, inputFields = [], ...params }) {
		super({
			...params,
			viewFolder: 'views/layouts/custom-multi-field-input',
			title: params.title,
			question: params.question,
			fieldName: params.fieldName
		});
		this.label = label;
		this.inputAttributes = inputAttributes;

		if (!inputFields || inputFields.length === 0) {
			throw new Error('inputFields are mandatory');
		}

		// Set default options for boolean fields if not provided
		this.inputFields = Array.from(inputFields).map((field: any) => {
			if (field.type !== 'boolean') return field;
			if (field.options) return /** type {BooleanField} */ field;
			return {
				...field,
				options: [
					{ text: 'Yes', value: 'yes' },
					{ text: 'No', value: 'no' }
				]
			};
		});
	}

	/**
	 * Process answers for the view model
	 */
	answerForViewModel(answers: Record<string, string>) {
		return this.inputFields.map((inputField: any) => {
			if (inputField.type === 'hidden') {
				return inputField;
			}

			if (inputField.type === 'radio' || inputField.type === 'boolean') {
				return {
					...inputField,
					options: inputField.options.map((option: any) => ({
						...option,
						checked: option.value === answers[inputField.fieldName]
					}))
				};
			}

			if (inputField.type === 'date') {
				const dateValue = answers[inputField.fieldName];
				const items = [
					{ name: 'day', value: '', classes: 'govuk-input--width-2' },
					{ name: 'month', value: '', classes: 'govuk-input--width-2' },
					{ name: 'year', value: '', classes: 'govuk-input--width-4' }
				];

				if (dateValue) {
					let day = '',
						month = '',
						year = '';

					if (typeof dateValue === 'string') {
						const parts = dateValue.split('/');
						day = parts[0];
						month = parts[1];
						year = parts[2];
					}

					if (day) items[0].value = day;
					if (month) items[1].value = month;
					if (year) items[2].value = year;
				}

				return {
					...inputField,
					items: items
				};
			}

			return {
				...inputField,
				value: this.#formatValue(answers[inputField.fieldName], inputField.formatTextFunction)
			};
		});
	}

	addCustomDataToViewModel(viewModel: QuestionViewModel) {
		viewModel.question.label = this.label;
		viewModel.question.attributes = this.inputAttributes;
	}

	/**
	 * Get the data to save from the request, returns an object of answers
	 */
	async getDataToSave(req: any): Promise<{ answers: Record<string, unknown> }> {
		const answers: Record<string, unknown> = {};

		for (const inputField of this.inputFields) {
			let value = req.body[inputField.fieldName];

			if (inputField.type === 'date') {
				const day = req.body[`${inputField.fieldName}-day`];
				const month = req.body[`${inputField.fieldName}-month`];
				const year = req.body[`${inputField.fieldName}-year`];

				if (day && month && year) {
					value = `${day}/${month}/${year}`;
				}
			} else {
				value = req.body[inputField.fieldName];
				if (typeof value === 'string') {
					value = value.trim();
				}
				if (inputField.type === 'boolean') {
					value = yesNoToBoolean(value);
				}
			}

			answers[inputField.fieldName] = value;
		}

		return { answers };
	}

	/**
	 * returns the formatted answers values to be used to build task list elements
	 */
	formatAnswerForSummary(sectionSegment: string, journey: any) {
		const summaryDetails = this.inputFields.reduce((acc: any, field: any) => {
			let answer;
			if (field.type === 'boolean' || field.type === 'radio') {
				answer = field.options.find((opt: any) => opt.value === journey.response.answers[field.fieldName])?.text || '';
			} else {
				answer = this.#formatValue(String(journey.response.answers[field.fieldName] || ''), field.formatTextFunction);
			}
			return answer ? acc + (field.formatPrefix || '') + answer + (field.formatJoinString || '\n') : acc;
		}, '');

		const formattedAnswer = this.#allQuestionsUnanswered(journey) ? this.notStartedText : summaryDetails || '';

		return [
			{
				key: `${this.title}`,
				value: this.isInManageListSection
					? // Avoid double <br> at the end of answer in manage list section
						escape(formattedAnswer).replace(/\n(?!$)/g, '<br>')
					: nl2br(escape(formattedAnswer)),
				action: this.getAction(sectionSegment, journey, summaryDetails)
			}
		];
	}

	/**
	 * checks whether any answers have been provided for input field questions
	 */
	#allQuestionsUnanswered(journey: Journey): boolean {
		return this.inputFields.every((field: any) => journey.response.answers[field.fieldName] === undefined);
	}

	/**
	 * returns formatted value/answer if formatting is provided (defaults to value provided)
	 */
	#formatValue(valueToFormat: string, formatTextFunction: any): string {
		if (typeof formatTextFunction === 'function' && valueToFormat) {
			return formatTextFunction(valueToFormat);
		}

		return valueToFormat;
	}
}
