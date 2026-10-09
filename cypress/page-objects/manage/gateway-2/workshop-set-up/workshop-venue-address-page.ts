import { BasePage } from '../../../base-page.ts';
import { workshopSetUp } from '../../../../fixtures/manage/gateway-2.ts';

class WorkshopVenueAddressPage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/gateway-2\/set-up-workshop\/workshop\/gateway-2-workshop-venue-address-1$/);
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
		this.venueNameField.clearAndWrite(name);
		this.venueAddressLine1field.clearAndWrite(addressLine1);
		this.venueTownOrCityField.clearAndWrite(townOrCity);
		this.venuePostcodeField.clearAndWrite(postcode);
		this.saveAndContinue();
	}
}
export const workshopVenueAddressPage = new WorkshopVenueAddressPage();
