import { BasePage } from '../base-page.ts';

export class PortalLandingPage extends BasePage {
	constructor() {
		super('/landingPage');
	}
}

export const portalLandingPage = new PortalLandingPage();
