/**
 * Questionnaire business logic service
 * Handles questionnaire creation, data transformation, and journey management
 * @module QuestionnaireService
 */

import { createQuestions } from '@planning-inspectorate/dynamic-forms/src/questions/create-questions.js';
import { questionClasses } from '@planning-inspectorate/dynamic-forms/src/questions/questions.js';
import { Section } from '@planning-inspectorate/dynamic-forms/src/section.js';
import { Journey } from '@planning-inspectorate/dynamic-forms/src/journey/journey.js';
import type { Request } from 'express';
import { QUESTIONNAIRE_CONFIG, type QuestionnaireAnswers, type TaskListSection } from './config.ts';

/**
 * Service class for questionnaire operations
 * Provides methods for creating questions, sections, journeys, and data transformation
 */
export class QuestionnaireService {
	/**
	 * Creates question objects from configuration
	 * @returns Question map for dynamic forms integration
	 */
	createQuestions() {
		const questionMethodOverrides = {
			'single-line-input': {},
			'text-entry': {},
			radio: {}
		};

		return createQuestions(QUESTIONNAIRE_CONFIG.questions, questionClasses, questionMethodOverrides);
	}

	/**
	 * Creates section objects containing questions
	 * @param questions - Question map from createQuestions()
	 * @returns Array of Section objects for the journey
	 */
	createSections(questions: any) {
		return QUESTIONNAIRE_CONFIG.sections.map((sectionConfig) => {
			const section = new Section(sectionConfig.title, sectionConfig.id);

			sectionConfig.questions.forEach((questionId) => {
				if (questions[questionId]) {
					section.addQuestion(questions[questionId]);
				}
			});

			return section;
		});
	}

	/**
	 * Creates a journey instance for dynamic forms
	 * @param questions - Question map from createQuestions()
	 * @param response - Journey response object from session
	 * @param req - Express request object
	 * @returns Journey instance configured for questionnaire
	 */
	createJourney(questions: any, response: any, req: Request) {
		if (!req.baseUrl.endsWith('/' + QUESTIONNAIRE_CONFIG.id)) {
			throw new Error(`Invalid journey request for URL: ${req.baseUrl}`);
		}

		const sections = this.createSections(questions);

		return new Journey({
			journeyId: QUESTIONNAIRE_CONFIG.id,
			sections,
			taskListUrl: QUESTIONNAIRE_CONFIG.routing.checkAnswers,
			journeyTemplate: QUESTIONNAIRE_CONFIG.templates.formQuestion,
			taskListTemplate: QUESTIONNAIRE_CONFIG.templates.checkAnswers,
			journeyTitle: 'Local Plans Questionnaire',
			returnToListing: false,
			makeBaseUrl: () => req.baseUrl,
			initialBackLink: `/questionnaire`,
			response
		});
	}

	/**
	 * Transforms questionnaire answers into task list format for template rendering
	 * @param answers - User's questionnaire responses
	 * @returns Object containing task list sections for check answers template
	 */
	transformToTaskList(answers: QuestionnaireAnswers): { sections: TaskListSection[] } {
		const sections: TaskListSection[] = QUESTIONNAIRE_CONFIG.sections.map((sectionConfig) => ({
			heading: sectionConfig.title,
			status: 'COMPLETED',
			list: { rows: [] }
		}));

		// Personal Information section
		if (answers.fullName) {
			sections[0].list.rows.push(
				this.createTaskListRow('Full name', answers.fullName, '/questionnaire/personal/full-name', 'full name')
			);
		}

		if (answers.email) {
			sections[0].list.rows.push(
				this.createTaskListRow('Email address', answers.email, '/questionnaire/personal/email', 'email address')
			);
		}

		// Experience section
		if (answers.rating) {
			sections[1].list.rows.push(
				this.createTaskListRow(
					'Overall rating',
					this.capitalizeFirst(answers.rating),
					'/questionnaire/experience/rating',
					'rating'
				)
			);
		}

		if (answers.feedback) {
			sections[1].list.rows.push(
				this.createTaskListRow('Feedback', answers.feedback, '/questionnaire/experience/feedback', 'feedback')
			);
		}

		return { sections };
	}

	/**
	 * Gets template configuration for check answers page
	 * @returns Template configuration object with name and path
	 */
	getTemplateConfig() {
		return {
			name: 'Dynamic Forms Check Your Answers',
			template: QUESTIONNAIRE_CONFIG.templates.checkAnswers
		};
	}

	/**
	 * Creates a task list row for the check answers template
	 * @param label - Display label for the field
	 * @param value - User's answer value
	 * @param changeUrl - URL to edit this field
	 * @param hiddenText - Accessible hidden text for screen readers
	 * @returns Task list row object
	 */
	private createTaskListRow(label: string, value: string, changeUrl: string, hiddenText: string) {
		return {
			key: { text: label },
			value: { text: value },
			actions: {
				items: [
					{
						href: changeUrl,
						text: 'Change',
						visuallyHiddenText: hiddenText
					}
				]
			}
		};
	}

	/**
	 * Capitalizes the first letter of a string
	 * @param str - String to capitalize
	 * @returns String with first letter capitalized
	 */
	private capitalizeFirst(str: string): string {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}
}

/** Singleton service instance for questionnaire operations */
export const questionnaireService = new QuestionnaireService();
