import { BasePage } from '../../base-page.ts';

export class DeletCasePage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/delete-case$/);
	}
}

export const deletCasePage = new DeletCasePage();
