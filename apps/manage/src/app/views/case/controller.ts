import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { ManageService } from '#service';
import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { JOURNEY_ID } from './journey.ts';
import type { Request, Response } from 'express';
import type { Prisma } from '@pins/local-plans-database/src/client/client.ts';

type ManageListAction = 'edit' | 'remove' | undefined;

/** The section within the case overview journey being edited. */
const CONTACTS_SECTION = 'contacts';

/** Shape of the fields we accept from the case overview form. */
interface CaseFormInput {
	planTitle?: string;
	planType?: string;
	planBand?: string;
	caseOfficer?: string;
	lpa?: string;
	lpaCode?: string;
	lpaContact?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	phone?: string;
	programmeOfficer?: string;
	examinationWebsite?: string;
	assessorGateway2?: string;
	assessorGateway3?: string;
	examiningInspector1?: string;
	examiningInspector2?: string;
	examiningInspector3?: string;
	qaInspector1?: string;
	qaInspector2?: string;
	qaInspector3?: string;
}

/** * Returns a handler that applies a single case-overview edit to the database. * The action (edit / remove / update) is derived from the route params. */
export function updateCaseField(service: ManageService) {
	return async ({ req, res }: { req: Request; res: Response }): Promise<void> => {
		const { db, logger } = service;

		const reference = getReference(req);
		const section = getParam(req.params.section);
		const action = req.params.manageListAction as ManageListAction;
		const currentItemId = getParam(req.params.manageListItemId);

		const answers = res.locals?.journeyResponse?.answers ?? {};
		logger.info(`Updating case ${reference} with ${JSON.stringify(answers)}`);

		if (action === 'remove') {
			await removeItem({ db, reference, section, currentItemId });
			return;
		}

		const input = processInputForDB(req.body as CaseFormInput);

		if (action === 'edit' && section === CONTACTS_SECTION) {
			await db.contact.update({
				where: { id: currentItemId },
				data: buildContactData(input)
			});
			return;
		}

		await db.case.update({
			where: { reference },
			data: buildCaseData(input, currentItemId)
		});
	};
}

/** Removes a contact, or disconnects an LPA from the case. */
async function removeItem({
	db,
	reference,
	section,
	currentItemId
}: {
	db: ManageService['db'];
	reference: string;
	section: string;
	currentItemId: string;
}): Promise<void> {
	if (section === CONTACTS_SECTION) {
		await db.contact.delete({ where: { id: currentItemId } });
		return;
	}
	await db.case.update({
		where: { reference },
		data: { lpas: { disconnect: { lpaCode: currentItemId } } }
	});
}

/** Builds the `data` payload for a case update (scalar fields + contact/LPA nesting). */
function buildCaseData(input: CaseFormInput, currentItemId: string): Prisma.CaseUpdateInput {
	const {
		planTitle,
		planType,
		planBand,
		caseOfficer,
		lpa,
		firstName,
		lastName,
		email,
		phone,
		programmeOfficer,
		examinationWebsite,
		assessorGateway2,
		assessorGateway3,
		examiningInspector1,
		examiningInspector2,
		examiningInspector3,
		qaInspector1,
		qaInspector2,
		qaInspector3
	} = input;

	const hasContact = Boolean(firstName || lastName || email || phone);

	return {
		planTitle,
		planType,
		planBand,
		caseOfficer,
		programmeOfficer,
		examinationWebsite,
		assessorGateway2,
		assessorGateway3,
		examiningInspector1,
		examiningInspector2,
		examiningInspector3,
		qaInspector1,
		qaInspector2,
		qaInspector3,
		contacts: hasContact ? { create: buildContactData(input) } : undefined,
		lpas: lpa
			? {
					connectOrCreate: lpaConnectOrCreate(lpa),
					disconnect: [{ lpaCode: currentItemId }]
				}
			: undefined
	};
}

/** Builds the shared contact `data` payload used by both create and update. */
function buildContactData(input: CaseFormInput): Prisma.ContactCreateWithoutCasesInput {
	const { firstName = '', lastName = '', email = '', phone = '', lpaCode, lpaContact } = input;
	return {
		firstName,
		lastName,
		email,
		phoneNumber: phone,
		lpa: { connectOrCreate: lpaConnectOrCreate(lpaCode || lpaContact || '') }
	};
}

/** A reusable `connectOrCreate` clause for an LPA by its code. */
function lpaConnectOrCreate(lpaCode: string): Prisma.LPACreateOrConnectWithoutContactsInput {
	return { where: { lpaCode }, create: { lpaCode } };
}

/** Normalises a route param that may be a string, string array, or undefined. */
function getParam(value: string | string[] | undefined): string {
	if (Array.isArray(value)) return value[0] ?? '';
	return value ?? '';
}

/** Extracts and validates the case reference from the route params. */
function getReference(req: Request): string {
	const { reference } = req.params;
	if (typeof reference !== 'string') throw new Error('reference must be a string');
	return reference;
}

/** * Trims every string value on the form input. * Returns a new object rather than mutating the request body. */
export function processInputForDB<T extends object>(input: T): T {
	const trimmed = {} as T;
	for (const key in input) {
		const value = input[key];
		trimmed[key] = (typeof value === 'string' ? value.trim() : value) as T[typeof key];
	}
	return trimmed;
}

export function buildGetJourneyMiddleware(service: ManageService): AsyncRequestHandler {
	return async (req, res, next) => {
		const { db, logger } = service;

		const rawReference = Array.isArray(req.params.reference) ? req.params.reference[0] : req.params.reference;
		let reference: string;
		try {
			reference = decodeURIComponent(rawReference);
		} catch {
			return res.status(404).render('views/errors/404.njk');
		}

		try {
			const currentCase = await db.case.findUnique({
				where: { reference },
				include: { lpas: true, contacts: true }
			});

			if (!currentCase) {
				return res.status(404).render('views/errors/404.njk');
			}

			// make planTitle and reference easily accessible in the template
			res.locals.planTitle = currentCase.planTitle;
			res.locals.reference = currentCase.reference;

			const journeyResponse = new JourneyResponse(JOURNEY_ID, '', currentCase);
			journeyResponse.answers.checkLpas = currentCase.lpas.map((lpa) => ({
				id: lpa.lpaCode,
				lpa: lpa.lpaCode
			}));
			journeyResponse.answers.contactDetails = currentCase.contacts.map((contact) => ({
				...contact,
				phone: contact.phoneNumber,
				lpaContact: contact.lpaCode
			}));
			res.locals.journeyResponse = journeyResponse;
		} catch (error) {
			logger.error(`Unable to fetch case ${reference} ${error}`);
		}

		if (next) next();
	};
}
