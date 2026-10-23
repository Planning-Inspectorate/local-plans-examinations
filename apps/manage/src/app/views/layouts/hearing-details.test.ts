import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { configureNunjucks } from '../../nunjucks.ts';
import { questions } from '../case/questions.ts';

const hearing = {
	hearingDate: '7 November 2026',
	hearingTime: '10:30',
	hearingExpectedDays: '3',
	hearingLocationType: 'hybrid',
	hearingRemoteMeetingLinkKnown: 'yes',
	hearingRemoteMeetingLink: 'https://example.com/hearing',
	hearingVenueName: 'Hearing venue',
	hearingAddressLine: '10 Test Road',
	hearingTownOrCity: 'London',
	hearingPostcode: 'EC1A 1BB'
};

describe('Hearing templates', () => {
	it('uses the configured time error in both the summary and inline message', () => {
		const html = configureNunjucks().render('views/layouts/custom-multi-field-input/index.njk', {
			layoutTemplate: 'views/layouts/forms-question.njk',
			config: { headerTitle: 'Manage', footerLinks: [] },
			question: {
				question: 'Hearing date and time',
				value: questions['examinationHearingDateAndTime-1'].answerForViewModel({})
			},
			errors: { 'hearingTime-1_hour': { msg: 'Enter a valid time' } },
			errorSummary: [{ text: 'Enter a valid time', href: '#hearingTime-1_hour' }]
		});
		assert.equal((html.match(/Enter a valid time/g) ?? []).length, 2);
		assert.ok(html.includes('id="hearingTime-1_hour"'));
		assert.ok(!html.includes('Time is not valid'));
	});

	it('adds direct Change links to each answer for the correct hearing number', () => {
		const html = configureNunjucks().renderString(
			'{% from "views/layouts/hearing-details.njk" import hearingDetails %}{{ hearingDetails(answers, reference) }}',
			{
				reference: 'PLAN-123456',
				answers: { hearings: [hearing, hearing] }
			}
		);
		for (const number of [1, 2]) {
			for (const question of [
				'examination-hearing-date-and-time',
				'examination-hearing-expected-days',
				'examination-hearing-location-type',
				'examination-hearing-remote-meeting-link-known',
				'examination-hearing-remote-meeting-link',
				'examination-hearing-venue-address'
			]) {
				assert.ok(html.includes(`href="/case/PLAN-123456/examination/set-up-hearing/hearing/${question}-${number}"`));
			}
			assert.ok(html.includes(`Hearing ${number} details`));
		}
		assert.equal((html.match(/govuk-summary-list__actions/g) ?? []).length, 14);
		for (const label of [
			'Time',
			'Number of days',
			'Format',
			'Do you have a remote meeting link?',
			'Remote meeting link',
			'Venue address'
		])
			assert.ok(html.includes(label));
	});

	it('shows the hearing banner below the tabs and retains other banner placement', () => {
		const env = configureNunjucks();
		const data = {
			config: { headerTitle: 'Manage', footerLinks: [] },
			navigation: [],
			summaryListData: { sections: [] },
			alertMessageStatus: 'success'
		};
		const hearingHtml = env.render('views/layouts/case-overview.njk', { ...data, alertMessage: 'Hearing created' });
		assert.ok(hearingHtml.indexOf('Hearing created') > hearingHtml.indexOf('id="service-navigation"'));
		const otherHtml = env.render('views/layouts/case-overview.njk', { ...data, alertMessage: 'Changes saved' });
		assert.ok(otherHtml.indexOf('Changes saved') < otherHtml.indexOf('id="service-navigation"'));
	});

	it('shows hearing history time in London without changing other history dates', () => {
		const html = configureNunjucks().render('views/layouts/case-overview.njk', {
			config: { headerTitle: 'Manage', footerLinks: [] },
			navigation: [],
			currentSection: 'case-history',
			currentCase: {
				caseHistories: [
					{ date: new Date('2026-10-22T12:34:00Z'), event: 'hybrid hearing set up', username: 'Test user' },
					{ date: new Date('2026-10-22T12:34:00Z'), event: 'Other update', username: 'Test user' }
				]
			}
		});
		assert.ok(html.includes('22 Oct 2026, 13:34'));
		assert.ok(html.includes('>22 Oct 2026</td>'));
	});
});
