import CustomMultiFieldInputQuestion from './custom-multi-field-input/question.ts';

/**
 * Typed wrapper around Object.freeze() to preserve inference for object literals.
 * @template {Record<string, any>} T
 * @param {T} obj
 * @returns {Readonly<T>}
 */
const freeze = (obj: any) => Object.freeze(obj);

/**
 * Derive the union type of allowed components from the object.
 * @typedef {typeof CUSTOM_COMPONENTS[keyof typeof CUSTOM_COMPONENTS]} CustomQuestionTypes
 */
export const CUSTOM_COMPONENTS = Object.freeze({
	CUSTOM_MULTI_FIELD_INPUT: 'custom-multi-field-input'
});

export const CUSTOM_COMPONENT_CLASSES = freeze({
	[CUSTOM_COMPONENTS.CUSTOM_MULTI_FIELD_INPUT]: CustomMultiFieldInputQuestion
});
