import CustomNoteQuestion from './question.ts';
import { describe, it, mock, after, before } from 'node:test';
import assert from 'node:assert/strict';
import nunjucks from 'nunjucks';

describe('test CustomNoteQuestion', () => {
	const question = new CustomNoteQuestion({
		title: 'someTitle',
		question: 'someQuestion',
		fieldName: 'someField',
		url: 'some-url',
		pageTitle: 'somePage',
		description: 'some description',
		validators: []
	});
	let mockNunjucksRender: any;
	before(async () => {
		mockNunjucksRender = mock.method(nunjucks, 'render', () => {
			return 'Mock render';
		});
	});
	describe('test formatAnswerForSummary', () => {
		it('correctly renders', () => {
			const result = question.formatAnswerForSummary('someSegment', {
				_csrf: 'some csrf token',
				response: {
					error: {
						errorSummary: 'some error summary'
					},
					answers: {
						reference: 'some case reference',
						notes: [
							{
								text: 'some note text 2',
								createdTime: new Date(Date.UTC(2026, 10, 7)), // '7/11/2026'
								createdBy: 'person b'
							},
							{
								text: 'some note text 1',
								createdTime: new Date(Date.UTC(2026, 10, 6)), // '6/11/2026'
								createdBy: 'person a'
							},
							{
								text: 'some note text 3',
								createdTime: new Date(Date.UTC(2026, 11, 7)), // '7/12/2026'
								createdBy: 'person c'
							}
						]
					}
				}
			});
			const expectedNunjucksArguments = {
				_csrf: 'some csrf token',
				errorSummary: 'some error summary',
				notes: [
					{
						createdBy: 'person c',
						createdTime: '7 December 2026 at 00:00',
						text: 'some note text 3'
					},
					{
						createdBy: 'person b',
						createdTime: '7 November 2026 at 00:00',
						text: 'some note text 2'
					},
					{
						createdBy: 'person a',
						createdTime: '6 November 2026 at 00:00',
						text: 'some note text 1'
					}
				],
				reference: 'some case reference'
			};
			assert.deepEqual(mockNunjucksRender.mock.calls[0].arguments[1], expectedNunjucksArguments);
		});
	});
	after(async () => {
		mockNunjucksRender.mock.restore();
	});
});
