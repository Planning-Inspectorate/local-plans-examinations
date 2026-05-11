export type FieldType = 'text' | 'select';

export interface BaseField {
	name: string;
	label: string;
	type: FieldType;
	required?: boolean;
}

export interface SelectField extends BaseField {
	type: 'select';
	options: string[];
}

export type FormField = BaseField | SelectField;
