import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { ManageService } from '#service';
import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { JOURNEY_ID } from './journey.ts';
import type { Request, Response } from 'express';

export function updateCaseField(service: ManageService) {
	return async ({ req, res }: { req: Request; res: Response }) => {
		const { db, logger } = service;
		const { reference } = req.params;
		if (typeof reference !== 'string') throw new Error('reference must be a string');

		const journeyResponse = res.locals?.journeyResponse?.answers || {};

		// can be an LPA code or a contact ID
		const currentItemId = Array.isArray(req.params.manageListItemId)
			? req.params.manageListItemId[0]
			: (req.params.manageListItemId ?? '');
		logger.info(`Updating case ${reference} with ${JSON.stringify(journeyResponse)}`);

		const removeItem = req.params.manageListAction === 'remove';
		if (removeItem) {
			if (req.params.section === 'contacts') {
				await db.contact.delete({
					where: { id: currentItemId }
				});
				return;
			}
			await db.case.update({
				where: { reference },
				data: {
					lpas: {
						disconnect: { lpaCode: currentItemId }
					}
				}
			});
			return;
		}

		//todo refactor
		const {
			planTitle,
			planType,
			caseOfficer,
			lpa,
			firstName,
			lastName,
			email,
			phone,
			lpaContact,
			lpaCode,
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
		} = processInputForDB(req.body);
		const data = {
			planTitle,
			planType,
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
			contacts:
				firstName || lastName || email || phone
					? {
							create: {
								firstName,
								lastName,
								email,
								phoneNumber: phone,
								lpa: {
									connectOrCreate: {
										where: { lpaCode: lpaCode || lpaContact },
										create: { lpaCode: lpaCode || lpaContact }
									}
								}
							}
						}
					: undefined,
			lpas: lpa
				? {
						connectOrCreate: { where: { lpaCode: lpa }, create: { lpaCode: lpa || lpaContact } },
						disconnect: [{ lpaCode: req.params.manageListItemId }]
					}
				: undefined
		};
		const editItem = req.params.manageListAction === 'edit';

		if (editItem && req.params.section === 'contacts') {
			await db.contact.update({
				where: { id: currentItemId },
				data: {
					firstName,
					lastName,
					email,
					phoneNumber: phone,
					lpa: {
						connectOrCreate: {
							where: { lpaCode: lpaCode || lpaContact },
							create: { lpaCode: lpaCode || lpaContact }
						}
					}
				}
			});
			return;
		}

		await db.case.update({
			where: { reference },
			data
		});
	};
}

export function processInputForDB(input: Record<string, string>): Record<string, string> {
	for (const key in input) input[key] = input[key].trim();
	return input;
}

export function buildGetJourneyMiddleware(service: ManageService): AsyncRequestHandler {
	return async (req, res, next) => {
		const { db, logger } = service;

		const rawReferenceString = Array.isArray(req.params.reference) ? req.params.reference[0] : req.params.reference;
		let reference: string;
		try {
			reference = decodeURIComponent(rawReferenceString);
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

			res.locals.journeyResponse = new JourneyResponse(JOURNEY_ID, '', currentCase);
			res.locals.journeyResponse.answers.checkLpas = currentCase.lpas.map((lpa) => ({
				id: lpa.lpaCode,
				lpa: lpa.lpaCode
			}));
			res.locals.journeyResponse.answers.contactDetails = currentCase.contacts.map((contact) => ({
				...contact,
				phone: contact.phoneNumber,
				lpaContact: contact.lpaCode
			}));
		} catch (error) {
			logger.error(`Unable to fetch case ${reference} ${error}`);
		}
		if (next) next();
	};
}

interface CaseDetails {
	planTitle: string;
	planType: string;
}

export async function getCaseData(reference: string, service: ManageService): Promise<CaseDetails> {
	const currentCase = await service.db.case.findUnique({
		where: { reference },
		include: { lpas: true, contacts: true }
	});

	return {
		planTitle: currentCase?.planTitle || '',
		planType: currentCase?.planType || ''
	};
}
