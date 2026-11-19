import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { gateway3SubmissionRoutes } from './gateway-3-submission/index.ts';
import { gateway3ResubmissionRoutes } from './gateway-3-resubmission/index.ts';
import { examinationSubmissionRoutes } from './examination-submission/index.ts';

const journeys = [
	{
		name: 'Gateway 3 submission',
		router: gateway3SubmissionRoutes,
		path: '/PLAN-001/gateway-3-submission/procedural-documents/statement-of-compliance'
	},
	{
		name: 'Gateway 3 resubmission',
		router: gateway3ResubmissionRoutes,
		path: '/PLAN-001/gateway-3-resubmission/additional-documents'
	},
	{
		name: 'Examination submission',
		router: examinationSubmissionRoutes,
		path: '/PLAN-001/examination/examination-details/statement-of-compliance'
	}
];

describe('Portal file-removal routes', () => {
	for (const journey of journeys) {
		for (const encoded of [true, false]) {
			it(`${journey.name} accepts ${encoded ? 'encoded' : 'decoded'} blob-path file IDs`, () => {
				const router = journey.router({ createFileStorage: () => ({}) } as never);
				const route = router.stack.find(
					(layer) => layer.route?.methods.post && layer.route.path.includes('/delete-document/')
				);
				const fileId = 'documents/case-id/statement-of-compliance/test-document.pdf';
				const requestFileId = encoded ? encodeURIComponent(fileId) : fileId;

				assert.ok(route, 'The file-removal POST route must exist');
				assert.ok(route.match(`${journey.path}/delete-document/${requestFileId}`));
				assert.equal([route.params.fileId].flat().join('/'), fileId);
			});
		}
	}
});
