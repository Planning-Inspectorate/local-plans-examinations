import type { Response, Request } from 'express';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';

export function buildLandingPage(): AsyncRequestHandler {
	return async (req: Request, res: Response) => {
		const testCases = [
			{
				caseRef: 'ref123',
				planTitle: 'Portishead',
				planType: 'local-plan',
				caseOfficer: 'Jane Jonathon',
				status: 'pending',
				gateway: 'Gateway 2'
			},
			{
				caseRef: 'ref223',
				planTitle: 'Clevedon',
				planType: 'local-plan',
				caseOfficer: 'Russell Bear',
				status: 'complete',
				gateway: 'Gateway 3'
			},
			{
				caseRef: 'ref323',
				planTitle: 'Southville',
				planType: 'local-plan',
				caseOfficer: 'Albert Robertson',
				status: 'pending',
				gateway: 'Gateway 2.5'
			}
		];

		return res.render('views/landing-page/landing-page.njk', { cases: testCases });
	};
}
