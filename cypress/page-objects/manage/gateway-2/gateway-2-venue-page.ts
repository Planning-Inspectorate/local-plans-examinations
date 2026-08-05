import { GatewayBasePage } from '../base/gateway-page.ts';

export class WorkshopVenuePage extends GatewayBasePage {
	constructor() {
		super(/^\/case\/.+\/gateway-2\/gateway-2\/gateway-2-workshop-venue$/);
	}

	get workshopVenueInput() {
		return cy.get('input[id="workshopVenue"]');
	}

	verifyWorkshopVenueForm(value: string) {
		this.workshopVenueInput.should('be.visible');
		this.workshopVenueInput.should('have.value', value);
	}

	enterWorkshopVenue(value: string) {
		this.workshopVenueInput.clearAndWrite(value);
		this.saveAndContinue();
	}

	verifyLoaded(planTitle: string) {
		super.verifyLoaded(planTitle);
		super.verifySaveAndContinueVisible();
	}
}

export const workshopVenuePage = new WorkshopVenuePage();
