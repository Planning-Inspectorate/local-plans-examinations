import { BasePage } from '../base-page.ts';
import type { guidanceSections } from '../../fixtures/portal/guidance.ts';

export class PortalGuidancePage extends BasePage {
	constructor() {
		super('/guidance');
	}

	get guidanceDesciption() {
		return cy.getByData('guidance-description');
	}

	verifyGuidanceDescription() {
		this.guidanceDesciption
			.should('be.visible')
			.and(
				'contain.text',
				'Get advice on what you need to do to successfully complete the gateway and examination process.'
			);
	}

	verifyGuidanceSection(section: (typeof guidanceSections)[number]) {
		cy.getByData(section.dataCy).within(() => {
			cy.contains('a', section.linkText).should('have.attr', 'href', section.href);
			cy.contains('a', '>').should('have.attr', 'href', section.href).and('have.attr', 'aria-label', section.linkText);
			cy.get('p').should('have.text', section.hint);
		});
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading('Guidance');
	}
}

export const portalGuidancePage = new PortalGuidancePage();
