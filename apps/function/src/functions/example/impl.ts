import type { FunctionService } from '../../service.ts';
import type { TimerHandler } from '@azure/functions';

/**
 * An example scheduled function implementation
 */
export function buildExampleFunction(service: FunctionService): TimerHandler {
	return async (timer, context) => {
		try {
			context.log('running example function on timer', timer);

			// check the DB connection is working
			await service.dbClient.$queryRaw`SELECT 1`;

			context.log('database OK');
		} catch (error: unknown) {
			let message;
			if (error instanceof Error) {
				context.log('Error during example function run:', error);
				message = error.message;
			}
			throw new Error('Error during example function run:' + message);
		}
	};
}
