import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import CustomManageListQuestion from './question.ts';

describe('ContactDetailsQuestion', () => {
	const TITLE = 'Contact details';
	const QUESTION = 'Contact details';
	const FIELDNAME = 'contactDetails';

	const newQuestion = (options = {}) => {
		return new CustomManageListQuestion({
			title: TITLE,
			question: QUESTION,
			fieldName: FIELDNAME,
			titleSingular: 'Contact',
			viewFolder: 'views/layouts/custom-manage-list',
			...options
		});
	};

	it('should create', () => {
		const question = newQuestion();
		assert.strictEqual(question.title, TITLE);
		assert.strictEqual(question.question, QUESTION);
		assert.strictEqual(question.fieldName, FIELDNAME);
		assert.strictEqual(question.viewFolder, 'views/layouts/custom-manage-list');
		assert.strictEqual(question.isManageListQuestion, true);
	});
});
