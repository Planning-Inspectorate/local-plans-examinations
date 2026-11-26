import { BasePage } from '../base-page.ts';

export class PortalHomePage extends BasePage {
	constructor() {
		super('/');
	}
}

export const portalHomePage = new PortalHomePage();
