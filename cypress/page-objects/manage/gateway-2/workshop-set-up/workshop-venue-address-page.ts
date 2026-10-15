import { BasePage } from '../../../base-page.ts';
import { workshopSetUp } from '../../../../fixtures/manage/gateway-2.ts';

export class WorkshopVenueAddressPage extends BasePage {
	constructor(workshopNumber = 1) {
		super(
			new RegExp(`^/case/.+/gateway-2/set-up-workshop/workshop/gateway-2-workshop-venue-address-${workshopNumber}$`)
		);
	}

	get venueNameField() {
		return cy.getByData(workshopSetUp.workshopVenueAddress.fieldNameVenueName);
	}
	get venueAddressLine1field() {
		return cy.getByData(workshopSetUp.workshopVenueAddress.fieldNameAddressLine1);
	}
	get venueTownOrCityField() {
		return cy.getByData(workshopSetUp.workshopVenueAddress.fieldNameTownOrCity);
	}
	get venuePostcodeField() {
		return cy.getByData(workshopSetUp.workshopVenueAddress.fieldNamePostcode);
	}

	enterAddressDetails(name: string, addressLine1: string, townOrCity: string, postcode: string) {
		this.verifyLoaded();
		this.venueNameField.clearAndWrite(name);
		this.venueAddressLine1field.clearAndWrite(addressLine1);
		this.venueTownOrCityField.clearAndWrite(townOrCity);
		this.venuePostcodeField.clearAndWrite(postcode);
		this.saveAndContinue();
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading(workshopSetUp.workshopVenueAddress.heading);
		this.verifyFieldsLoaded();
	}

	verifyFieldsLoaded() {
		this.venueNameField.should('be.visible');
		this.venueAddressLine1field.should('be.visible');
		this.venueTownOrCityField.should('be.visible');
		this.venuePostcodeField.should('be.visible');
	}
}
export const workshopVenueAddressPage = new WorkshopVenueAddressPage();
