/**
 * Accepts either a caseId or a caseReference
 */
export type CaseIdOrCaseReference =
	{ caseId: string; caseReference?: string } | { caseId?: string; caseReference: string };
