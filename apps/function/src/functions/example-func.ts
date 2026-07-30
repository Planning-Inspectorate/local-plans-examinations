import { app } from '@azure/functions';
import { initialiseService } from '../init.ts';
import { buildExampleFunction } from './example/impl.ts';

const service = initialiseService();

if (service.exampleEnabled) {
	console.log(`registering 'example-func' on schedule ${service.exampleSchedule}`);

	app.timer('example-func', {
		schedule: service.exampleSchedule,
		handler: buildExampleFunction(service)
	});
}
