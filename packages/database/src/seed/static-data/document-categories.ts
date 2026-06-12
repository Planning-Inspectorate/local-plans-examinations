import { GATEWAY_ID, DOCUMENT_CATEGORY_ID } from './ids/index.ts';

export const DOCUMENT_CATEGORY = [
	{
		id: DOCUMENT_CATEGORY_ID.PROCEDURAL,
		gatewayId: GATEWAY_ID.GATEWAY_2,
		displayName: 'Procedural',
		folderName: 'procedural',
		displayOrder: 1
	},
	{
		id: DOCUMENT_CATEGORY_ID.CONSULATION,
		gatewayId: GATEWAY_ID.GATEWAY_2,
		displayName: 'Consultation',
		folderName: 'consultation',
		displayOrder: 2
	}
];
