import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { ManageService } from '#service';
import { JourneyResponse, type SaveDataFn } from '@planning-inspectorate/dynamic-forms';
import type { Request, Response } from 'express';
import type { Prisma, PrismaClient } from '@pins/local-plans-database/src/client/client.ts';

type ManageListAction = 'edit' | 'remove' | undefined;

/** The section within the case overview journey being edited. */
const CONTACTS_SECTION = 'contacts';

interface CaseOverviewInput {
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

interface Gateway1Input {
	noticeOfIntention?: Date;
	estimatedGateway1Date?: Date;
	completedGateway1Date?: Date;
	slaSentDate?: Date;
	slaReceivedDate?: Date;
	dsaChecked?: string;
}

interface Gateway2Input {
	estimatedDate?: Date;
	actualDate?: Date;
	validDate?: Date;
	assessorDate?: Date;
	assessorAppointmentDate?: Date;
	workshopDate?: Date;
	workshopVenue?: string;
	reportIssuedDate?: Date;
	reportPublishedByLPA?: Date;
}

/** * Returns a handler that applies a single case-overview edit to the database. * The action (edit / remove / update) is derived from the route params. */
export function updateCaseField(service: ManageService): SaveDataFn {
	return async ({ req, res, data }: { req: Request; res: Response; data: Record<string, any> }): Promise<void> => {
		const { db, logger } = service;

		const reference = getReference(req);
		const section = getParam(req.params.section);
		const action = req.params.manageListAction as ManageListAction;
		const currentItemId = getParam(req.params.manageListItemId);

		if (action === 'remove') {
			await removeItem({ db, reference, section, currentItemId });
			return;
		}
		logger.info(res.locals);
		const firstSegmentUrl = getFirstSegmentOfUrl(req.url);
		switch (firstSegmentUrl) {
			case 'overview':
				await updateOverview(
					db,
					trimStringValues(data.answers as CaseOverviewInput),
					reference,
					action,
					section,
					currentItemId,
					req.params.question
				);
				break;
			case 'gateway-1':
				await updateGateway1(db, trimStringValues(data.answers as Gateway1Input), reference);
				break;
			case 'gateway-2':
				await updateGateway2(db, trimStringValues(data.answers as Gateway2Input), reference);
				break;
			default:
				//TODO redirect to case overview
				console.log('!!\nurl not found');
				break;
		}
	};
}

interface CaseFormInput extends CaseOverviewInput, Gateway1Input {}

async function updateOverview(
	db: PrismaClient,
	answers: CaseFormInput,
	caseId: string,
	action?: string,
	section?: string,
	currentItemId?: string,
	question?: string
) {
	// Editing a contact's details (incl. changing that contact's LPA)
	if (section === CONTACTS_SECTION && action === 'edit' && currentItemId) {
		await db.contact.update({
			where: { id: currentItemId },
			data: buildContactData(answers)
		});
		return;
	}

	// Changing the LPA associated with the *case*:
	// replace the old LPA (currentItemId) with the newly selected one (answers.lpa)
	if (question === 'check-lpas' && answers.lpa) {
		await db.case.update({
			where: { reference: caseId },
			data: {
				lpas: {
					connectOrCreate: {
						where: {
							lpaCode: answers.lpa
						},
						create: {
							lpaCode: answers.lpa
						}
					},
					disconnect: currentItemId ? [{ lpaCode: currentItemId }] : undefined
				}
			}
		});
		return;
	}

	// The manage-list summary POSTs carry no item data to persist
	if (question === 'check-lpas' || question === 'check-contact-details') {
		return;
	}

	// Updating case (scalar) details + any newly added contact / LPA
	await db.case.update({
		where: { reference: caseId },
		data: buildCaseData(answers, currentItemId ?? '')
	});
}

// async function updateOverview(
// 	db: PrismaClient,
// 	answers: CaseOverviewInput,
// 	caseId: string, action?: string | undefined,
// 	section?: string | undefined,
// 	currentItemId?: string | undefined,
// 	question?: string | undefined
// ) {
// 	if (question === 'check-lpas') {
// 		return
// 	}
// 	if (question === 'check-contact-details') {
// 		return
// 	}
// 	await db.case.update({
// 		where: { reference: caseId},
// 		data: answers
// 	})
// }

async function updateGateway1(db: PrismaClient, answers: Gateway1Input, caseId: string) {
	await db.gateway1Info.upsert({
		where: { caseId },
		update: { ...answers },
		create: { caseId, ...answers }
	});
}

async function updateGateway2(db: PrismaClient, answers: Gateway2Input, caseId: string) {
	await db.gateway2Info.upsert({
		where: { caseId },
		update: { ...answers },
		create: { caseId, ...answers }
	});
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
function buildCaseData(formData: CaseFormInput, currentItemId: string): Prisma.CaseUpdateInput {
	// get scalar values
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
		qaInspector3,
		noticeOfIntention,
		estimatedGateway1Date,
		completedGateway1Date,
		slaSentDate,
		slaReceivedDate,
		dsaChecked
	} = formData;

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
		noticeOfIntention,
		estimatedGateway1Date,
		completedGateway1Date,
		slaSentDate,
		slaReceivedDate,
		dsaChecked,
		contacts: hasContact ? { create: buildContactData(formData) } : undefined,
		lpas: lpa
			? {
					connectOrCreate: lpaConnectOrCreate(lpa),
					disconnect: [{ lpaCode: currentItemId }]
				}
			: undefined
	};
}

/** Builds the shared contact `data` payload used by both create and update. */
function buildContactData(formData: CaseFormInput): Prisma.ContactCreateWithoutCasesInput {
	const { firstName = '', lastName = '', email = '', phone = '', lpaCode, lpaContact } = formData;
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
export function trimStringValues<T extends object>(input: T): T {
	const trimmed = {} as T;
	for (const key in input) {
		const value = input[key];
		trimmed[key] = (typeof value === 'string' ? value.trim() : value) as T[typeof key];
	}
	return trimmed;
}

export function buildGetJourneyMiddleware(service: ManageService, journeyId: string): AsyncRequestHandler {
	return async (req, res, next) => {
		const { db, logger } = service;
		const reference = getReference(req);

		const planTitle = await db.case.findUnique({
			where: { reference },
			select: { planTitle: true }
		});
		if (!planTitle) return res.status(404).render('views/errors/404.njk');
		res.locals.planTitle = planTitle.planTitle;
		res.locals.reference = reference;

		const currentPage = getFirstSegmentOfUrl(req.url);
		switch (currentPage) {
			case 'overview': {
				const overviewData = await getOverviewData(db, reference);
				if (!overviewData) return res.status(404).render('views/errors/404.njk');
				const journeyResponse = new JourneyResponse(journeyId, '', overviewData);
				res.locals.journeyResponse = journeyResponse;
				journeyResponse.answers.checkLpas = overviewData.lpas.map((lpa) => ({
					id: lpa.lpaCode,
					lpa: lpa.lpaCode
				}));
				journeyResponse.answers.contactDetails = overviewData.contacts.map((contact) => ({
					...contact,
					phone: contact.phoneNumber,
					lpaContact: contact.lpaCode
				}));
				if (next) next();
				return;
			}
			case 'gateway-1': {
				const journey1Data = await db.gateway1Info.findUnique({ where: { caseId: reference } });
				res.locals.journeyResponse = new JourneyResponse(journeyId, '', journey1Data);
				if (next) next();
				return;
			}
			case 'gateway-2': {
				const journey2Data = await db.gateway2Info.findUnique({ where: { caseId: reference } });
				res.locals.journeyResponse = new JourneyResponse(journeyId, '', journey2Data);
				if (next) next();
				return;
			}
			default:
				logger.error(`Unknown page ${currentPage} for case ${reference}`);
		}
	};
}

/** Adds the case section navigation to locals for the case routes. */
export function addCaseNavigation(): AsyncRequestHandler {
	return async (req, res, next) => {
		const reference = getReference(req);
		res.locals.navigation = createNavigationParameters(req.url, reference);
		if (next) next();
	};
}

function createNavigationParameters(path: string, reference: string) {
	const baseUrl = `/case/${encodeURIComponent(reference)}`;
	const items = [
		{ text: 'Overview', href: `${baseUrl}/overview` },
		{ text: 'Timetable', href: '#' },
		{ text: 'Gateway 1', href: `${baseUrl}/gateway-1` },
		{ text: 'Gateway 2', href: `${baseUrl}/gateway-2` },
		{ text: 'Gateway 3', href: '#' },
		{ text: 'Examination', href: '#' },
		{ text: 'Case History', href: '#' }
	];
	return items.map((item) => ({
		...item,
		active: item.href.includes(path)
	}));
}

function getFirstSegmentOfUrl(url: string): string {
	return url.split('/').filter(Boolean)[0];
}

async function getOverviewData(db: PrismaClient, reference: string) {
	return db.case.findUnique({
		where: { reference },
		include: { lpas: true, contacts: true }
	});
}
