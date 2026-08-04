import { BasePage } from '../../base-page.ts';

export class WorkshopVenuePage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/gateway-2\/gateway-2\/gateway-2-workshop-venue$/);
	}

	get workshopVenueInput() {
		return cy.get('[id="workshopVenue"], input[name="workshopVenue"]');
	}

	verifyWorkshopVenueForm(value?: string) {
		this.verifyHeading('What is the venue for the Gateway 2 workshop?');
		this.workshopVenueInput.should('be.visible');

		if (value) {
			this.workshopVenueInput.should('have.value', value);
		}

		this.verifySaveAndContinueVisible();
	}

	verifyWorkshopVenueFilled(value: string) {
		this.workshopVenueInput.should('have.value', value);
	}

	verifyLoaded(value?: string) {
		super.verifyLoaded();
		this.verifyWorkshopVenueForm(value);
	}

	enterWorkshopVenue(value: string) {
		this.workshopVenueInput.clearAndWrite(value);
		this.saveAndContinue();
	}
}

export const workshopVenuePage = new WorkshopVenuePage();
