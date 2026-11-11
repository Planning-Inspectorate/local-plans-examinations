import { digitalSupportingMaterial } from '../../../fixtures/portal/digital-supporting-material.ts';
import { SingleLineInputPage } from '../base/single-line-input-page.ts';

export const digitalSupportingMaterialPage = new SingleLineInputPage(
	new RegExp(
		`^/manage-local-plans/[^/]+/gateway-2-submission/${digitalSupportingMaterial.section}/${digitalSupportingMaterial.path}$`
	),
	digitalSupportingMaterial.fieldName,
	digitalSupportingMaterial.heading,
	digitalSupportingMaterial.addCy,
	digitalSupportingMaterial.value
);
