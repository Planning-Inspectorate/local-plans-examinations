import CustomMultiFieldInputQuestion from './custom-multi-field-input/question.ts';
import CustomManageListQuestion from './custom-manage-list/question.ts';
import {
	CUSTOM_COMPONENTS as pinsCustomComponents,
	CUSTOM_COMPONENT_CLASSES as pinsCustomClasses
} from '@pins/local-plans-lib/forms/custom-components/index.ts';

/**
 * Typed wrapper around Object.freeze() to preserve inference for object literals.
 */
const freeze = (obj: any): Readonly<any> => Object.freeze(obj);

/**
 * Derive the union type of allowed components from the object.
 */
export const CUSTOM_COMPONENTS = Object.freeze({
	CUSTOM_MULTI_FIELD_INPUT: 'custom-multi-field-input',
	CUSTOM_MANAGE_LIST: 'custom-manage-list',
	...pinsCustomComponents
});

export const CUSTOM_COMPONENT_CLASSES = freeze({
	[CUSTOM_COMPONENTS.CUSTOM_MULTI_FIELD_INPUT]: CustomMultiFieldInputQuestion,
	[CUSTOM_COMPONENTS.CUSTOM_MANAGE_LIST]: CustomManageListQuestion,
	...pinsCustomClasses
});
