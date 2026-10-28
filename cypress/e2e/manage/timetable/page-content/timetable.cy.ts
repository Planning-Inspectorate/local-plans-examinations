import type { SeededManageCase } from '../../../../flows/manage/seeded-case-flow.ts';
import { seededTimetable } from '../../../../fixtures/manage/timetable.ts';
import { timetablePage } from '../../../../page-objects/manage/timetable/timetable-page.ts';

describe('Timetable page content', () => {
	let seededCase: SeededManageCase;

	before(() => {
		cy.task('clearDb');
		cy.task<SeededManageCase>('seedDb', seededTimetable).then((result) => {
			seededCase = result;
		});
	});

	beforeEach(() => timetablePage.visit(`/case/${seededCase.reference}/timetable`));

	after(() => cy.task('clearDb'));

	it('displays the timetable sections, saved dates and action links', { tags: ['regression'] }, () => {
		timetablePage.verifyContent(seededCase.reference, seededCase.planTitle);
	});
});
