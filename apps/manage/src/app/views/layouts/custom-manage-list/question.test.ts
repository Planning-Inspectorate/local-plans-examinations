import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import nunjucks from 'nunjucks';
import CustomManageListQuestion from './question.ts';

describe('CustomManageListQuestion', () => {
	const TITLE = 'Contact details';
	const QUESTION = 'Contact details';
	const FIELDNAME = 'contactDetails';

	const newQuestion = (options = {}) => {
		const question = new CustomManageListQuestion({
			title: TITLE,
			question: QUESTION,
			fieldName: FIELDNAME,
			titleSingular: 'Contact',
			viewFolder: 'views/layouts/custom-manage-list',
			...options
		});

		question.section = { questions: [] } as any;
		return question;
	};

	const buildJourney = (answers = {}) => ({
		response: { answers },
		journeyTemplate: 'test-template',
		taskListUrl: '/task-list',
		journeyTitle: 'Journey',
		getBackLink: () => '/back'
	});

	it('should create', () => {
		const question = newQuestion();
		assert.strictEqual(question.title, TITLE);
		assert.strictEqual(question.question, QUESTION);
		assert.strictEqual(question.fieldName, FIELDNAME);
		assert.strictEqual(question.viewFolder, 'views/layouts/custom-manage-list');
		assert.strictEqual(question.isManageListQuestion, true);
	});

	it('should set the custom summary properties on the view model', () => {
		const question = newQuestion({
			maximumAnswers: 3,
			emptyListText: 'No contacts yet',
			isAllowedEmpty: false,
			confirmRemoveButtonText: 'Remove contact',
			removalPrompt: 'Are you sure you want to remove this contact?'
		});

		const viewModel: any = {
			question: {
				value: [{ id: '1' }, { id: '2' }]
			}
		};

		question.addCustomDataToViewModel(viewModel);

		assert.strictEqual(viewModel.question.hideRemoveButton, false);
		assert.strictEqual(viewModel.confirmRemoveButtonText, 'Remove contact');
		assert.strictEqual(viewModel.emptyListText, 'No contacts yet');
		assert.strictEqual(viewModel.hideAddButton, false);
		assert.strictEqual(viewModel.removalPrompt, 'Are you sure you want to remove this contact?');
	});

	it('should hide the remove button when exactly one answer exists and the list is not allowed to be empty', () => {
		const question = newQuestion();
		const viewModel: any = {
			question: {
				value: [{ id: '1' }]
			}
		};

		question.addCustomDataToViewModel(viewModel);

		assert.strictEqual(viewModel.question.hideRemoveButton, true);
	});

	it('should hide the add button once the maximum answer count has been reached', () => {
		const question = newQuestion({ maximumAnswers: 2 });
		const viewModel: any = {
			question: {
				value: [{ id: '1' }, { id: '2' }]
			}
		};

		question.addCustomDataToViewModel(viewModel);

		assert.strictEqual(viewModel.hideAddButton, true);
	});

	it('should render a summary row for each item and include the configured action', () => {
		const question = newQuestion();
		question.section = {
			questions: [
				{
					title: 'First name',
					fieldName: 'firstName',
					shouldDisplay: () => true,
					formatAnswerForSummary: () => [{ value: 'Jane' }]
				},
				{
					title: 'Email',
					fieldName: 'email',
					shouldDisplay: () => true,
					formatAnswerForSummary: () => [{ value: 'jane@example.com' }]
				}
			]
		} as any;

		question.getAction = () => ({ href: '/edit', text: 'Change', visuallyHiddenText: 'Contact details' });

		const originalRender = nunjucks.render;
		nunjucks.render = () => 'Jane, jane@example.com';

		try {
			const summary = question.formatAnswerForSummary('case', buildJourney(), [
				{ id: '1', firstName: 'Jane', email: 'jane@example.com' }
			] as any);

			assert.strictEqual(summary[0].key, 'Contact details');
			assert.match(summary[0].value, /Jane/);
			assert.match(summary[0].value, /jane@example.com/);
			assert.deepEqual(summary[0].action, {
				href: '/edit',
				text: 'Change',
				visuallyHiddenText: 'Contact details'
			});
		} finally {
			nunjucks.render = originalRender;
		}
	});

	it('should return the not started summary when the answer is empty', () => {
		const question = newQuestion();
		question.getAction = () => ({ href: '/edit', text: 'Change', visuallyHiddenText: 'Contact details' });

		const summary = question.formatAnswerForSummary('case', buildJourney(), undefined as any);

		assert.deepEqual(summary, [
			{
				key: 'Contact details',
				value: 'Not started',
				action: {
					href: '/edit',
					text: 'Change',
					visuallyHiddenText: 'Contact details'
				}
			}
		]);
	});

	it('should rehydrate the view model when validation errors are present', () => {
		const question = newQuestion();
		const req: any = {
			body: {
				errors: { firstName: 'required' },
				errorSummary: ['This field is required']
			},
			originalUrl: '/contact-details',
			params: { reference: 'PLAN-123456' }
		};
		const section: any = { name: 'Case' };
		const journey: any = {
			...buildJourney(),
			getBackLink: () => '/back'
		};

		const viewModel = question.checkForValidationErrors(req, section, journey, { fieldName: FIELDNAME });

		assert.ok(viewModel);
		assert.deepEqual(viewModel.errors, { firstName: 'required' });
		assert.deepEqual(viewModel.errorSummary, ['This field is required']);
		assert.strictEqual(viewModel.originalUrl, '/contact-details');
	});
});
