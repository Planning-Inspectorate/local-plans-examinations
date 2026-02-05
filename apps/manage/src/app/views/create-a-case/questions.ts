import {
	COMPONENT_TYPES,
	createQuestions,
	questionClasses,
	RequiredValidator,
	StringValidator,
	EmailValidator
} from '@planning-inspectorate/dynamic-forms';

//TODO ask Ben about adding an optional DB field to a question to make it easier to map question to DB
export function getQuestions() {
	const questions = {
		caseOfficer: {
			type: COMPONENT_TYPES.SELECT,
			title: 'Case officer',
			question: 'Case officer',
			fieldName: 'caseOfficer',
			url: 'case-officer',
			validators: [new RequiredValidator('Select the Case Officer')],
			options: [
				{ text: '', value: '' },
				{ text: 'Melissa', value: 'melissa' },
				{ text: 'Louise Louise', value: 'Louise Louise' },
				{ text: 'Emamuzo', value: 'emamuzo' },
				{ text: 'Ben', value: 'ben' },
				{ text: 'Jonathon', value: 'jonathon' },
				{ text: 'Kayenat', value: 'kayenat' },
				{ text: 'Hattie', value: 'hattie' },
				{ text: 'Attila', value: 'attila' },
				{ text: 'Simon', value: 'simon' },
				{ text: 'Jan', value: 'jan' }
			]
		},
		planTitle: {
			type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
			title: 'Plan title',
			question: 'Plan title',
			fieldName: 'planTitle',
			url: 'plan-title',
			validators: [
				new RequiredValidator('Enter the title of the Plan'),
				new StringValidator({
					maxLength: {
						maxLength: 2000,
						maxLengthMessage: 'Title must be 2000 characters or less'
					}
				})
			]
		},
		typeOfApplication: {
			type: COMPONENT_TYPES.RADIO,
			title: 'Plan type',
			question: 'Plan type',
			fieldName: 'typeOfApplication',
			url: 'plan-type',
			validators: [new RequiredValidator('Select the type for this plan')],
			options: [
				{ text: 'Community Infrastructure Levy (CIL)', value: 'cil' },
				{ text: 'Local Plan', value: 'lp' },
				{ text: 'Minerals and Waste', value: 'mw' },
				{ text: 'Spatial Development Strategies', value: 'sdp' },
				{ text: 'Supplementary Plan', value: 'sp' },
				{ text: 'Other', value: 'other' }
			]
		},
		lpaName: {
			type: COMPONENT_TYPES.SELECT,
			title: 'Lead local planning authority for this plan',
			question: 'Lead local planning authority for this plan',
			fieldName: 'lpaName',
			url: 'lead-LPA',
			validators: [new RequiredValidator('Select the lead LPA for this plan')],
			options: [
				{ text: '', value: '' },
				{ text: 'Melissa', value: 'melissa' },
				{ text: 'Louise Louise', value: 'Louise Louise' },
				{ text: 'Emamuzo', value: 'emamuzo' },
				{ text: 'Ben', value: 'ben' },
				{ text: 'Jonathon', value: 'jonathon' },
				{ text: 'Kayenat', value: 'kayenat' },
				{ text: 'Hattie', value: 'hattie' },
				{ text: 'Attila', value: 'attila' },
				{ text: 'Simon', value: 'simon' },
				{ text: 'Jan', value: 'jan' }
			]
		},
		leadContactName: {
			type: COMPONENT_TYPES.MULTI_FIELD_INPUT,
			title: 'Lead contact name',
			question: 'Lead contact name',
			fieldName: 'leadContactName',
			url: 'lead-contact-name',
			inputFields: [
				{
					fieldName: 'leadContactFirstName',
					label: 'First name'
				},
				{
					fieldName: 'leadContactLastName',
					label: 'Last name'
				}
			]
		},
		leadContactEmail: {
			type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
			title: 'Lead contact email address',
			question: 'Lead contact email address',
			fieldName: 'leadContactEmail',
			url: 'lead-contact-email',
			validators: [
				new EmailValidator({
					options: {},
					errorMessage: 'Please enter valid email address',
					fieldName: 'leadContactEmail'
				})
			]
		},
		leadContactPhone: {
			type: COMPONENT_TYPES.SINGLE_LINE_INPUT,
			title: 'Lead contact phone number',
			question: 'Lead contact phone number',
			fieldName: 'leadContactPhone',
			url: 'lead-contact-phone',
			validators: [new RequiredValidator('Tell us your number!!')]
		},
		secondaryLPA: {
			type: COMPONENT_TYPES.BOOLEAN,
			title: 'Is there a secondary Local Planning Authority?',
			question: 'Is there a secondary Local Planning Authority?',
			fieldName: 'secondaryLPA',
			url: 'secondary-lpa',
			validators: [new RequiredValidator('Please indicate if there is a secondary LPA')]
		},
		anotherContact: {
			type: COMPONENT_TYPES.BOOLEAN,
			title: 'Do you want to add another contact?',
			question: 'Do you want to add another contact?',
			fieldName: 'anotherContact',
			url: 'another-contact',
			validators: [new RequiredValidator('Please tell us if you want to add another contact.')]
		}
	};
	return createQuestions(questions, questionClasses, {});
}
