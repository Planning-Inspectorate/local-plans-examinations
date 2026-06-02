import type { Request, Response } from 'express';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { ManageService } from '#service';

interface Row {
	key: {
		text: string;
	};
	value: {
		text: string;
	};
	actions?: {
		items: {
			href: string;
			text: string;
			visuallyHiddenText?: string;
		}[];
	};
}

export function buildCasePage(service: ManageService): AsyncRequestHandler {
	return async (req: Request, res: Response) => {
		const { db, logger } = service;
		const rawReferenceString = Array.isArray(req.params.reference) ? req.params.reference[0] : req.params.reference;

		if (!rawReferenceString) {
			return res.status(404).render('views/errors/404.njk');
		}

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

			rows[0].value.text = currentCase.planTitle || '-';
			rows[1].value.text = currentCase.planType || '-';
			rows[3].value.text = currentCase.lpas.map((lpa) => lpa.lpaCode).join(', ') || '-';
			rows[4].value.text = currentCase.caseOfficer || '-';

			return res.render('views/case/case.njk', {
				backLinkUrl: '/',
				backLinkText: 'Back to all cases',
				pageTitle: currentCase.reference,
				pageHeading: currentCase.planTitle,
				pageCaption: currentCase.reference,
				rows
			});
		} catch (error) {
			logger.error(`Unable to fetch case ${reference} ${error}`);
			return res.status(500).render('views/errors/500.njk', { error });
		}
	};
}
const rows: Row[] = [
	{
		key: {
			text: 'Plan title'
		},
		value: {
			text: '-'
		},
		actions: {
			items: [
				{
					href: '#',
					text: 'Change',
					visuallyHiddenText: 'change'
				}
			]
		}
	},
	{
		key: {
			text: 'Plan type'
		},
		value: {
			text: '-'
		},
		actions: {
			items: [
				{
					href: '#',
					text: 'Change',
					visuallyHiddenText: 'change'
				}
			]
		}
	},
	{
		key: {
			text: 'Plan band'
		},
		value: {
			text: '-'
		},
		actions: {
			items: [
				{
					href: '#',
					text: 'Change',
					visuallyHiddenText: 'change'
				}
			]
		}
	},
	{
		key: {
			text: 'Local Planning Authority'
		},
		value: {
			text: '-'
		},
		actions: {
			items: [
				{
					href: '#',
					text: 'Change',
					visuallyHiddenText: 'change'
				}
			]
		}
	},
	{
		key: {
			text: 'Case officer'
		},
		value: {
			text: '-'
		},
		actions: {
			items: [
				{
					href: '#',
					text: 'Change',
					visuallyHiddenText: 'change'
				}
			]
		}
	}
];
