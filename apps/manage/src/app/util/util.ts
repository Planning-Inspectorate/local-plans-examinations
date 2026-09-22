import { booleanToYesNoValue } from '@planning-inspectorate/dynamic-forms';

export function formatValue(value: any) {
	if (typeof value === 'boolean') {
		return booleanToYesNoValue(value);
	}
	return value;
}
