// @ts-nocheck

import { mockLogger } from '@pins/local-plans-lib/testing/mock-logger.ts';
import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { configureNunjucks } from '../../nunjucks.ts';
import { buildApplicationPage } from './controller.ts';
import { StatusTag, buildPlans, buildPlan, buildTestPlans, buildApplicationDocs } from '../../types.ts';

function initialiseTest(params: {}, plan?: unknown[]) {
	const nunjucks = configureNunjucks();
	const mockRes = {
		render: mock.fn((view, data) => nunjucks.render(view, data)),
		status: mock.fn(function (code) {
			return this;
		}),
		send: mock.fn()
	};
	const mockReq = { session: {}, params };
	const logger = mockLogger();
	const mockService = {
		logger,
		getPlans: mock.fn(async () => (plan ? [buildPlan(plan)] : buildTestPlans()))
	};
	const applicationPage = buildApplicationPage(mockService);
	return { applicationPage, mockRes, mockReq, nunjucks, logger };
}

function cleanHtml(html: string) {
	return html
		.replace(/\s+/g, ' ')
		.replace(/>\s+</g, '><')
		.replace(/>\s+([^<]+)\s+</g, '>$1<')
		.trim();
}

describe('application page', () => {
	it('should render without error', async () => {
		const param = { refNum: 'PLAN-001', stage: 1 };

		const { applicationPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(param);
		await assert.doesNotReject(() => applicationPage(mockReq, mockRes));

		assert.strictEqual(mockRes.render.mock.callCount(), 1);
		assert.strictEqual(mockRes.render.mock.calls[0].arguments.length, 2);
		assert.strictEqual(mockRes.render.mock.calls[0].arguments[0], 'views/applicationPage/view.njk');
	});

	it('should display stage 1 (Gateway 2 application) title and caption correctly in all stages', async () => {
		const param = { refNum: 'PLAN-001', stage: 1 };

		const plans = [
			{ refNum: 'PLAN/001', stage: 1 },
			{ refNum: 'PLAN/001', stage: 2 },
			{ refNum: 'PLAN/001', stage: 3 }
		];

		const expectedPageTitle = 'Gateway 2 application';
		const expectedPageCaption = 'PLAN/001';
		const expectedHTML =
			'<h1 class="govuk-heading-xl"><span class="govuk-caption-xl">PLAN/001</span>Gateway 2 application</h1>';

		for (let i = 0; i < plans.length; i++) {
			const { applicationPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(param, plans[i]);
			await assert.doesNotReject(() => applicationPage(mockReq, mockRes));

			const [view, data] = mockRes.render.mock.calls[0].arguments;
			const html = nunjucks.render(view, data);

			assert.strictEqual(data.pageTitle, expectedPageTitle, `expected ${expectedPageTitle} but got ${data.pageTitle}`);
			assert.strictEqual(
				data.pageCaption,
				expectedPageCaption,
				`expected ${expectedPageCaption} but got ${data.pageCaption}`
			);

			assert.ok(cleanHtml(html).includes(cleanHtml(expectedHTML)), `expected html to contain ${expectedHTML}`);
		}
	});

	it('should render summary table correctly (Plan name, Target date, Local planning authority, linked LPA)', async () => {
		const param = { refNum: 'PLAN-001', stage: 1 };

		const { applicationPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(param);
		await assert.doesNotReject(() => applicationPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		const expectedPlanTitle = 'East Borough Local Plan';
		const expectedPlanTitleHTML =
			'<dt class="govuk-summary-list__key">Plan name</dt><dd class="govuk-summary-list__value">East Borough Local Plan</dd>';

		const expectedTargetDate = '21 July 2026';
		const expectedTargetDateHTML =
			'<dt class="govuk-summary-list__key">Target date</dt><dd class="govuk-summary-list__value">21 July 2026</dd>';

		const expectedLPA = 'Southampton City Council';
		const expectedLPAHTML =
			'<dt class="govuk-summary-list__key">Local planning authority</dt><dd class="govuk-summary-list__value">Southampton City Council</dd>';

		const expectedLinkLPA = 'Romsey Town Council';
		const expectedLinkLPAHTML =
			'<dt class="govuk-summary-list__key">Linked local planning authorities</dt><dd class="govuk-summary-list__value">Romsey Town Council</dd>';

		assert.strictEqual(data.planTitle, expectedPlanTitle, `expected ${expectedPlanTitle} but got ${data.planTitle}`);
		assert.ok(
			cleanHtml(html).includes(cleanHtml(expectedPlanTitleHTML)),
			`expected html to contain ${expectedPlanTitleHTML}`
		);

		assert.strictEqual(
			data.targetDate,
			expectedTargetDate,
			`expected ${expectedTargetDate} but got ${data.targetDate}`
		);
		assert.ok(
			cleanHtml(html).includes(cleanHtml(expectedTargetDateHTML)),
			`expected html to contain ${expectedTargetDateHTML}`
		);

		assert.strictEqual(data.leadLPA, expectedLPA, `expected ${expectedLPA} but got ${data.leadLPA}`);
		assert.ok(cleanHtml(html).includes(cleanHtml(expectedLPAHTML)), `expected html to contain ${expectedLPAHTML}`);

		assert.strictEqual(data.linkedLPA, expectedLinkLPA, `expected ${expectedLinkLPA} but got ${data.linkedLPA}`);
		assert.ok(
			cleanHtml(html).includes(cleanHtml(expectedLinkLPAHTML)),
			`expected html to contain ${expectedLinkLPAHTML}`
		);
	});

	it('should render a save and come back button', async () => {
		const param = { refNum: 'PLAN-001', stage: 1 };

		const { applicationPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(param);
		await assert.doesNotReject(() => applicationPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		const expectedBackHTML = '<a href="/planPage/PLAN-001" class="govuk-link">Save and come back later</a>';

		assert.ok(cleanHtml(html).includes(cleanHtml(expectedBackHTML)), `expected html to contain ${expectedBackHTML}`);
	});

	it('should render Application incomplete if all sections not complete', async () => {
		const param = { refNum: 'PLAN-001', stage: 1 };

		const { applicationPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(param);
		await assert.doesNotReject(() => applicationPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		const expectedSectionTitle = 'Application incomplete';
		const sectionTitle = data.sectionTracker[0].title.text;
		const expectedSectionTitleHTML = '';

		assert.strictEqual(expectedSectionTitle, sectionTitle, `expected ${expectedSectionTitle} but got ${sectionTitle}`);
		assert.ok(
			cleanHtml(html).includes(cleanHtml(expectedSectionTitleHTML)),
			`expected html to contain ${expectedSectionTitleHTML}`
		);
	});

	it('should render Application complete if all sections complete', async () => {
		const param = { refNum: 'PLAN-001', stage: 1 };

		const plan = {
			documents: [
				{ title: 0, type: 0, state: 2, dateCompleted: '16/06/2026' },
				{ title: 1, type: 0, state: 2, dateCompleted: '16/06/2026' },
				{ title: 2, type: 0, state: 2, dateCompleted: '16/06/2026' },
				{ title: 3, type: 0, state: 2, dateCompleted: '16/06/2026' },
				{ title: 4, type: 0, state: 2, dateCompleted: '16/06/2026' },
				{ title: 5, type: 1, state: 2, dateCompleted: '16/06/2026' },
				{ title: 6, type: 1, state: 2, dateCompleted: '16/06/2026' },
				{ title: 7, type: 1, state: 2, dateCompleted: '16/06/2026' },
				{ title: 8, type: 1, state: 2, dateCompleted: '16/06/2026' },
				{ title: 9, type: 1, state: 2, dateCompleted: '16/06/2026' },
				{ title: 10, type: 1, state: 2, dateCompleted: '16/06/2026' },
				{ title: 11, type: 1, state: 2, dateCompleted: '16/06/2026' },
				{ title: 12, type: 1, state: 2, dateCompleted: '16/06/2026' },
				{ title: 13, type: 1, state: 2, dateCompleted: '16/06/2026' },
				{ title: 14, type: 2, state: 1, dateCompleted: '16/06/2026' }
			]
		};

		const { applicationPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(param, plan);
		await assert.doesNotReject(() => applicationPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		const expectedSectionTitle = 'Application complete';
		const sectionTitle = data.sectionTracker[0].title.text;
		const expectedSectionTitleHTML = '';

		assert.strictEqual(expectedSectionTitle, sectionTitle, `expected ${expectedSectionTitle} but got ${sectionTitle}`);
		assert.ok(
			cleanHtml(html).includes(cleanHtml(expectedSectionTitleHTML)),
			`expected html to contain ${expectedSectionTitleHTML}`
		);
	});

	it('should render the correct amount of sections complete for G2', async () => {
		const param = { refNum: 'PLAN-001', stage: 1 };

		const plans = [
			{
				documents: [
					{ title: 0, type: 0, state: 0 },
					{ title: 1, type: 0, state: 0 },
					{ title: 2, type: 0, state: 0 },
					{ title: 3, type: 0, state: 0 },
					{ title: 4, type: 0, state: 0 },
					{ title: 5, type: 1, state: 0 },
					{ title: 6, type: 1, state: 0 },
					{ title: 7, type: 1, state: 0 },
					{ title: 8, type: 1, state: 0 },
					{ title: 9, type: 1, state: 0 },
					{ title: 10, type: 1, state: 0 },
					{ title: 11, type: 1, state: 0 },
					{ title: 12, type: 1, state: 0 },
					{ title: 13, type: 1, state: 0 },
					{ title: 14, type: 2, state: 0 }
				]
			},
			{
				documents: [
					{ title: 0, type: 0, state: 2, dateCompleted: '16/06/2026' },
					{ title: 1, type: 0, state: 2, dateCompleted: '16/06/2026' },
					{ title: 2, type: 0, state: 2, dateCompleted: '16/06/2026' },
					{ title: 3, type: 0, state: 2, dateCompleted: '16/06/2026' },
					{ title: 4, type: 0, state: 2, dateCompleted: '16/06/2026' },
					{ title: 5, type: 1, state: 0 },
					{ title: 6, type: 1, state: 0 },
					{ title: 7, type: 1, state: 0 },
					{ title: 8, type: 1, state: 0 },
					{ title: 9, type: 1, state: 0 },
					{ title: 10, type: 1, state: 0 },
					{ title: 11, type: 1, state: 0 },
					{ title: 12, type: 1, state: 0 },
					{ title: 13, type: 1, state: 0 },
					{ title: 14, type: 2, state: 0 }
				]
			},
			{
				documents: [
					{ title: 0, type: 0, state: 2, dateCompleted: '16/06/2026' },
					{ title: 1, type: 0, state: 2, dateCompleted: '16/06/2026' },
					{ title: 2, type: 0, state: 2, dateCompleted: '16/06/2026' },
					{ title: 3, type: 0, state: 2, dateCompleted: '16/06/2026' },
					{ title: 4, type: 0, state: 2, dateCompleted: '16/06/2026' },
					{ title: 5, type: 1, state: 2, dateCompleted: '16/06/2026' },
					{ title: 6, type: 1, state: 2, dateCompleted: '16/06/2026' },
					{ title: 7, type: 1, state: 2, dateCompleted: '16/06/2026' },
					{ title: 8, type: 1, state: 2, dateCompleted: '16/06/2026' },
					{ title: 9, type: 1, state: 2, dateCompleted: '16/06/2026' },
					{ title: 10, type: 1, state: 2, dateCompleted: '16/06/2026' },
					{ title: 11, type: 1, state: 2, dateCompleted: '16/06/2026' },
					{ title: 12, type: 1, state: 2, dateCompleted: '16/06/2026' },
					{ title: 13, type: 1, state: 2, dateCompleted: '16/06/2026' },
					{ title: 14, type: 2, state: 0 }
				]
			},
			{
				documents: [
					{ title: 0, type: 0, state: 2, dateCompleted: '16/06/2026' },
					{ title: 1, type: 0, state: 2, dateCompleted: '16/06/2026' },
					{ title: 2, type: 0, state: 2, dateCompleted: '16/06/2026' },
					{ title: 3, type: 0, state: 2, dateCompleted: '16/06/2026' },
					{ title: 4, type: 0, state: 2, dateCompleted: '16/06/2026' },
					{ title: 5, type: 1, state: 2, dateCompleted: '16/06/2026' },
					{ title: 6, type: 1, state: 2, dateCompleted: '16/06/2026' },
					{ title: 7, type: 1, state: 2, dateCompleted: '16/06/2026' },
					{ title: 8, type: 1, state: 2, dateCompleted: '16/06/2026' },
					{ title: 9, type: 1, state: 2, dateCompleted: '16/06/2026' },
					{ title: 10, type: 1, state: 2, dateCompleted: '16/06/2026' },
					{ title: 11, type: 1, state: 2, dateCompleted: '16/06/2026' },
					{ title: 12, type: 1, state: 2, dateCompleted: '16/06/2026' },
					{ title: 13, type: 1, state: 2, dateCompleted: '16/06/2026' },
					{ title: 14, type: 2, state: 2, dateCompleted: '16/06/2026' }
				]
			}
		];

		const expectedSectionHint = [
			'You have completed 0 of 3 sections.',
			'You have completed 1 of 3 sections.',
			'You have completed 2 of 3 sections.',
			'You have completed 3 of 3 sections.'
		];

		const expectedSectionHintHTML = [
			'<div id="task-list-1-hint" class="govuk-task-list__hint">You have completed 0 of 3 sections.',
			'<div id="task-list-1-hint" class="govuk-task-list__hint">You have completed 1 of 3 sections.',
			'<div id="task-list-1-hint" class="govuk-task-list__hint">You have completed 2 of 3 sections.',
			'<div id="task-list-1-hint" class="govuk-task-list__hint">You have completed 3 of 3 sections.'
		];

		for (let i = 0; i < plans.length; i++) {
			const { applicationPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(param, plans[i]);
			await assert.doesNotReject(() => applicationPage(mockReq, mockRes));

			const [view, data] = mockRes.render.mock.calls[0].arguments;
			const html = nunjucks.render(view, data);
			const sectionHint = data.sectionTracker[0].hint.text;

			assert.strictEqual(
				sectionHint,
				expectedSectionHint[i],
				`expected ${expectedSectionHint[i]} but got ${sectionHint}`
			);
			assert.ok(
				cleanHtml(html).includes(cleanHtml(expectedSectionHintHTML[i])),
				`expected html to contain ${expectedSectionHintHTML[i]}`
			);
		}
	});

	it('should render correct doc section headers for G2 (Procedural documents, 2. Consultation documents 3. Submit)', async () => {
		const param = { refNum: 'PLAN-001', stage: 1 };

		const { applicationPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(param);
		await assert.doesNotReject(() => applicationPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		const expectedHeaders = ['1. Procedural documents', '2. Consultation documents', '3. Submit'];
		const headers = [data.DocsStructured[0].heading, data.DocsStructured[1].heading, data.DocsStructured[2].heading];
		const expectedHeadersHTML = [
			'<th scope="col" class="govuk-table__header"><h2 class=\'govuk-heading-m govuk-!-margin-bottom-0\'>1. Procedural documents</h2></th>',
			'<th scope="col" class="govuk-table__header"><h2 class=\'govuk-heading-m govuk-!-margin-bottom-0\'>2. Consultation documents</h2></th>',
			'<th scope="col" class="govuk-table__header"><h2 class=\'govuk-heading-m govuk-!-margin-bottom-0\'>3. Submit</h2></th>'
		];

		for (let i = 0; i < expectedHeaders.length; i++) {
			assert.strictEqual(expectedHeaders[i], headers[i], `expected ${expectedHeaders[i]} but got ${headers[i]}`);
			assert.ok(
				cleanHtml(html).includes(cleanHtml(expectedHeadersHTML[i])),
				`expected html to contain ${expectedHeadersHTML[i]}`
			);
		}
	});

	it('should render correct tag for each section header for G2 (Procedural documents, 2. Consultation documents 3. Submit)', async () => {
		const param = { refNum: 'PLAN-001', stage: 1 };

		const { applicationPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(param);
		await assert.doesNotReject(() => applicationPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		const tags = [data.DocsStructured[0].tag.label, data.DocsStructured[1].tag.label, data.DocsStructured[2].tag.label];
		const expectedTags = ['Not started', 'Not started', 'Not started'];

		const expectedTagHTML = [
			'<th scope="col" class="govuk-table__header govuk-!-text-align-right"><strong class="govuk-tag govuk-tag govuk-tag govuk-tag--grey">Not started</strong></th>',
			'<th scope="col" class="govuk-table__header govuk-!-text-align-right"><strong class="govuk-tag govuk-tag govuk-tag govuk-tag--grey">Not started</strong></th>',
			'<th scope="col" class="govuk-table__header govuk-!-text-align-right"><strong class="govuk-tag govuk-tag govuk-tag govuk-tag--grey">Not started</strong></th>'
		];

		for (let i = 0; i < expectedTags.length; i++) {
			assert.strictEqual(expectedTags[i], tags[i], `expected ${expectedTags[i]} but got ${tags[i]}`);
			assert.ok(
				cleanHtml(html).includes(cleanHtml(expectedTagHTML[i])),
				`expected html to contain ${expectedTagHTML[i]}`
			);
		}
	});

	it('should render correct documents in each section for G2', async () => {
		const param = { refNum: 'PLAN-001', stage: 1 };

		const { applicationPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(param);
		await assert.doesNotReject(() => applicationPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		const expectedDocs = [
			[
				//g2
				'Gateway 2 cover letter',
				'Local plan timetable',
				'Project initiation document',
				'Draft statement of compliance',
				'Draft statement of soundness'
			],
			[
				//g3
				'Consultation statement',
				'Consultation summary for scoping consultation',
				'Consultation summary for proposed local plan content and evidence documents',
				'Notice of intention to commence local plan preparation',
				'Scoping consultation documents',
				'Consultation summary of feedback to scoping consultation',
				'Gateway 1 Self assessment of readiness',
				'Consultation on proposed local plan content and evidence documents',
				'Summary of consultation responses'
			],
			[
				//E
				'Accept declaration and submit'
			]
		];

		const docs = [data.DocsStructured[0].rows, data.DocsStructured[1].rows, data.DocsStructured[2].rows];

		const expectedDocsHTML = [
			[
				'<dt class="govuk-summary-list__key">Gateway 2 cover letter</dt>',
				'<dt class="govuk-summary-list__key">Local plan timetable</dt>',
				'<dt class="govuk-summary-list__key">Project initiation document</dt>',
				'<dt class="govuk-summary-list__key">Draft statement of compliance</dt>',
				'<dt class="govuk-summary-list__key">Draft statement of soundness</dt>'
			],
			[
				//g3
				'<dt class="govuk-summary-list__key">Consultation statement</dt>',
				'<dt class="govuk-summary-list__key">Consultation summary for scoping consultation</dt>',
				'<dt class="govuk-summary-list__key">Consultation summary for proposed local plan content and evidence documents</dt>',
				'<dt class="govuk-summary-list__key">Notice of intention to commence local plan preparation</dt>',
				'<dt class="govuk-summary-list__key">Scoping consultation documents</dt>',
				'<dt class="govuk-summary-list__key">Consultation summary of feedback to scoping consultation</dt>',
				'<dt class="govuk-summary-list__key">Gateway 1 Self assessment of readiness</dt>',
				'<dt class="govuk-summary-list__key">Consultation on proposed local plan content and evidence documents</dt>',
				'<dt class="govuk-summary-list__key">Summary of consultation responses</dt>'
			],
			[
				//E
				'<dt class="govuk-summary-list__key">Accept declaration and submit</dt>'
			]
		];

		for (let i = 0; i < expectedDocs.length; i++) {
			for (let j = 0; j < expectedDocs[i].length; j++) {
				assert.strictEqual(
					expectedDocs[i][j],
					docs[i][j].key.text,
					`expected ${expectedDocs[i][j]} but got ${docs[i][j].key.text}`
				);
				assert.ok(
					cleanHtml(html).includes(cleanHtml(expectedDocsHTML[i][j])),
					`expected html to contain ${expectedDocsHTML[i][j]}`
				);
			}
		}
	});

	it('should render correct doc states in each section for G2', async () => {
		const param = { refNum: 'PLAN-001', stage: 1 };

		const { applicationPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(param);
		await assert.doesNotReject(() => applicationPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		const expectedDocStates = [
			[
				//g2
				'Not started',
				'Not started',
				'Not started',
				'Not started',
				'Not started'
			],
			[
				//g3
				'Not started',
				'Not started',
				'Not started',
				'Not started',
				'Not started',
				'Not started',
				'Not started',
				'Not started',
				'Not started'
			],
			[
				//E
				'Not started'
			]
		];

		const docStates = [data.DocsStructured[0].rows, data.DocsStructured[1].rows, data.DocsStructured[2].rows];

		const expectedDocStatesHTML = [
			[
				//g2
				'Gateway 2 cover letter</dt><dd class="govuk-summary-list__value"><span class="govuk-caption-m">Not started</span>',
				'Local plan timetable</dt><dd class="govuk-summary-list__value"><span class="govuk-caption-m">Not started</span>',
				'Project initiation document</dt><dd class="govuk-summary-list__value"><span class="govuk-caption-m">Not started</span>',
				'<dt class="govuk-summary-list__key">Local plan timetable</dt>',
				'Draft statement of compliance</dt><dd class="govuk-summary-list__value"><span class="govuk-caption-m">Not started</span>',
				'<dt class="govuk-summary-list__key">Draft statement of compliance</dt>',
				'Draft statement of soundness</dt><dd class="govuk-summary-list__value"><span class="govuk-caption-m">Not started</span>'
			],
			[
				//g3
				'Consultation statement</dt><dd class="govuk-summary-list__value"><span class="govuk-caption-m">Not started</span>',
				'Consultation summary for scoping consultation</dt><dd class="govuk-summary-list__value"><span class="govuk-caption-m">Not started</span>',
				'Consultation summary for proposed local plan content and evidence documents</dt><dd class="govuk-summary-list__value"><span class="govuk-caption-m">Not started</span>',
				'Notice of intention to commence local plan preparation</dt><dd class="govuk-summary-list__value"><span class="govuk-caption-m">Not started</span>',
				'Scoping consultation documents</dt><dd class="govuk-summary-list__value"><span class="govuk-caption-m">Not started</span>',
				'Consultation summary of feedback to scoping consultation</dt><dd class="govuk-summary-list__value"><span class="govuk-caption-m">Not started</span>',
				'Gateway 1 Self assessment of readiness</dt><dd class="govuk-summary-list__value"><span class="govuk-caption-m">Not started</span>',
				'Consultation on proposed local plan content and evidence documents</dt><dd class="govuk-summary-list__value"><span class="govuk-caption-m">Not started</span>',
				'Summary of consultation responses</dt><dd class="govuk-summary-list__value"><span class="govuk-caption-m">Not started</span>'
			],
			[
				//E
				'Accept declaration and submit</dt><dd class="govuk-summary-list__value"><span class="govuk-caption-m">Not started</span>'
			]
		];

		for (let i = 0; i < expectedDocStates.length; i++) {
			for (let j = 0; j < expectedDocStates[i].length; j++) {
				const docState = docStates[i][j].value.html.match(/>(.*?)</)?.[1] ?? '';
				assert.strictEqual(
					expectedDocStates[i][j],
					docState,
					`expected ${expectedDocStates[i][j]} but got ${docState}`
				);
				assert.ok(
					cleanHtml(html).includes(cleanHtml(expectedDocStatesHTML[i][j])),
					`expected html to contain ${expectedDocStatesHTML[i][j]}`
				);
			}
		}
	});

	it('should render correct doc actions in each section for G2', async () => {
		const param = { refNum: 'PLAN-001', stage: 1 };

		const { applicationPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(param);
		await assert.doesNotReject(() => applicationPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		const expectedDocActions = [
			[
				//g2
				'Add',
				'Add',
				'Add',
				'Add',
				'Add'
			],
			[
				//g3
				'Add',
				'Add',
				'Add',
				'Add',
				'Add',
				'Add',
				'Add',
				'Add',
				'Add'
			],
			[
				//E
				'Add'
			]
		];

		const docActions = [data.DocsStructured[0].rows, data.DocsStructured[1].rows, data.DocsStructured[2].rows];

		const expectedDocActionsHTML = [
			[
				'<a class="govuk-link" href="/fileUpload/0">Add</a>',
				'<a class="govuk-link" href="/fileUpload/1">Add</a>',
				'<a class="govuk-link" href="/fileUpload/2">Add</a>',
				'<a class="govuk-link" href="/fileUpload/3">Add</a>',
				'<a class="govuk-link" href="/fileUpload/4">Add</a>'
			],
			[
				//g3
				'<a class="govuk-link" href="/fileUpload/5">Add</a>',
				'<a class="govuk-link" href="/fileUpload/6">Add</a>',
				'<a class="govuk-link" href="/fileUpload/7">Add</a>',
				'<a class="govuk-link" href="/fileUpload/8">Add</a>',
				'<a class="govuk-link" href="/fileUpload/9">Add</a>',
				'<a class="govuk-link" href="/fileUpload/10">Add</a>',
				'<a class="govuk-link" href="/fileUpload/11">Add</a>',
				'<a class="govuk-link" href="/fileUpload/12">Add</a>',
				'<a class="govuk-link" href="/fileUpload/13">Add</a>'
			],
			[
				//E
				'<a class="govuk-link" href="/fileUpload/14">Add</a>'
			]
		];

		for (let i = 0; i < expectedDocActions.length; i++) {
			for (let j = 0; j < expectedDocActions[i].length; j++) {
				const docAction = docActions[i][j].actions.items[0].text;
				assert.strictEqual(
					expectedDocActions[i][j],
					docAction,
					`expected ${expectedDocActions[i][j]} but got ${docAction}`
				);
				assert.ok(
					cleanHtml(html).includes(cleanHtml(expectedDocActionsHTML[i][j])),
					`expected html to contain ${expectedDocActionsHTML[i][j]}`
				);
			}
		}
	});

	it('should return 404 when plan is not found', async () => {
		const param = { refNum: 'PLAN-999' };

		const { applicationPage, mockRes, mockReq, logger } = initialiseTest(param);
		await assert.doesNotReject(() => applicationPage(mockReq, mockRes));

		assert.strictEqual(logger.warn.mock.callCount(), 1);

		assert.deepStrictEqual(logger.warn.mock.calls[0].arguments, [{ planRef: 'PLAN/999' }, 'Plan not found']);

		assert.strictEqual(mockRes.status.mock.calls[0].arguments[0], 404);

		assert.strictEqual(mockRes.send.mock.calls[0].arguments[0], 'Plan not found');

		assert.strictEqual(mockRes.render.mock.callCount(), 0);
	});

	it('should return 404 when plan exists but is invalid', async () => {
		const param = { refNum: 'PLAN-001', stage: 1 };

		const plan = {
			refNum: 'PLAN/001',
			title: 'Error Plan',
			stage: 999,
			status: 999
		};

		const { applicationPage, mockRes, mockReq, logger } = initialiseTest(param, plan);
		await assert.doesNotReject(() => applicationPage(mockReq, mockRes));

		assert.strictEqual(mockRes.status.mock.calls[0].arguments[0], 404);

		assert.strictEqual(mockRes.send.mock.calls[0].arguments[0], 'Plan not found');
	});
});
