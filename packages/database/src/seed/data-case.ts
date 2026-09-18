import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';

/**
 * Parse a dd/mm/yyyy date string into a Date (UTC)
 * (mirrors apps/manage/src/app/util/date.ts)
 */
function parseDate(value: string): Date {
	const [dayStr, monthStr, yearStr] = value.split('/');
	const day = Number(dayStr);
	const month = Number(monthStr);
	const year = Number(yearStr);

	const date = new Date(Date.UTC(year, month - 1, day));

	if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) {
		throw new Error(`Invalid date: ${value}`);
	}

	return date;
}

interface SeedContact {
	firstName: string;
	lastName: string;
	email: string;
	phone?: string;
	lpaContact: string;
}

interface SeedCaseAnswers {
	reference: string;
	email: string;
	caseOfficer: string;
	planTitle: string;
	planType: string;
	lpas: { lpaCode: string; lpaName: string }[];
	contacts: SeedContact[];
	intentionToCommenceDate?: string;
	gateway1Date?: string;
	gateway2Date?: string;
	gateway3Date?: string;
	expectedSubmissionForExaminationDate?: string;
}

/**
 * Seed a single Case plus all related tables
 * (LPAs, Contacts, CaseHistory, Gateway1/2/3Info, ExaminationInfo)
 */
export async function seedCase(dbClient: PrismaClient, answers: SeedCaseAnswers, currentUser = 'Seed Script') {
	const uniqueLpaCodes = [...new Set(answers.lpas.map((l) => l.lpaCode))];
	const nameFor = (code: string) => answers.lpas.find((l) => l.lpaCode === code)?.lpaName ?? '';

	await dbClient.$transaction(async (tx) => {
		const createdCase = await tx.case.create({
			data: {
				reference: answers.reference,
				email: answers.email,
				caseOfficer: answers.caseOfficer,
				planTitle: answers.planTitle,
				planType: answers.planType,
				lpas: {
					connectOrCreate: uniqueLpaCodes.map((lpaCode) => ({
						where: { lpaCode },
						create: { lpaCode, lpaName: nameFor(lpaCode) }
					}))
				},
				contacts: {
					create: answers.contacts.map((contact) => ({
						firstName: contact.firstName,
						lastName: contact.lastName,
						email: contact.email,
						phoneNumber: contact.phone || '',
						lpaCode: contact.lpaContact
					}))
				},
				caseHistories: {
					create: {
						event: `Case created for plan ${answers.planTitle}`,
						username: currentUser
					}
				}
			}
		});

		await Promise.all([
			tx.gateway1Info.create({
				data: {
					caseId: createdCase.id,
					...(answers.intentionToCommenceDate && {
						noticeOfIntention: parseDate(answers.intentionToCommenceDate)
					}),
					...(answers.gateway1Date && {
						expectedGateway1Date: parseDate(answers.gateway1Date)
					})
				}
			}),
			tx.gateway2Info.create({
				data: {
					caseId: createdCase.id,
					...(answers.gateway2Date && { expectedDate: parseDate(answers.gateway2Date) })
				}
			}),
			tx.gateway3Info.create({
				data: {
					caseId: createdCase.id,
					...(answers.gateway3Date && { expectedDate: parseDate(answers.gateway3Date) })
				}
			}),
			tx.examinationInfo.create({
				data: {
					caseId: createdCase.id,
					...(answers.expectedSubmissionForExaminationDate && {
						expectedSubmissionForExaminationDate: parseDate(answers.expectedSubmissionForExaminationDate)
					})
				}
			})
		]);

		console.log(`Seeded case ${createdCase.reference} (${createdCase.id})`);
	});
}
