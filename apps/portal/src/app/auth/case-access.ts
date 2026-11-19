import type { Prisma } from '@pins/local-plans-database/src/client/client.ts';

/**
 * Prisma filter for the non-deleted cases a portal user may access.
 *
 * A user has access when their email is the case's primary email (`Case.email`)
 * or belongs to any contact on the case, so every contact added in manage can sign in.
 */
export function caseAccessWhere(email: string): Prisma.CaseWhereInput {
	return {
		deletedDate: null,
		OR: [{ email }, { contacts: { some: { email } } }]
	};
}
